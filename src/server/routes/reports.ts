import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';

const router = Router();
router.use(authenticate);

function isDbConnected() { return mongoose.connection.readyState === 1; }

// Helper to call Groq Chat Completions API
async function callGroqChat(apiKey: string, systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2 
    }),
    signal: AbortSignal.timeout(15000) // 15 second timeout for AI
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { status: response.status, message: errorData?.error?.message || 'Failed to call Groq' };
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// GET /api/reports/data - Get logs and AI summary
router.get('/data', async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured.' });
    }

    if (!isDbConnected()) {
      return res.status(500).json({ error: 'Database is not connected.' });
    }

    const { SymptomLog } = await import('../models/SymptomLog.js');
    const { Medication } = await import('../models/Medication.js');

    // Parse days from query
    const daysParam = req.query.days as string;
    let targetDate: Date | null = null;
    let periodText = 'All Time';

    if (daysParam !== 'all') {
      const days = parseInt(daysParam) || 30;
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - days);
      periodText = `Last ${days} Days`;
    }

    const query: any = { userId: req.user._id };
    if (targetDate) {
      query.loggedAt = { $gte: targetDate };
    }

    const logs = await SymptomLog.find(query).sort({ loggedAt: 1 }).populate('medicationId', 'name');

    const meds = await Medication.find({ userId: req.user._id });

    if (logs.length === 0) {
      return res.json({
        summary: `Patient has no symptom or medication logs recorded in this period (${periodText}).`,
        logs: [],
        period: periodText
      });
    }

    // Condense logs for AI
    const logSummary = logs.map(l => {
      const symps = l.symptoms.map((s: any) => `${s.name} (${s.severity})`).join(', ');
      return `Date: ${l.loggedAt.toISOString().split('T')[0]} | Symptoms: ${symps || 'None'} | Notes: ${l.rawText}`;
    }).join('\n');

    const medSummary = meds.map(m => `${m.name} (${m.dosage})`).join(', ');

    const systemPrompt = `You are an AI Clinical Assistant. Your job is to read raw, messy patient symptom logs from ${periodText} and generate a highly professional, concise Clinical Summary for a healthcare provider.
- Keep it to a single paragraph.
- Highlight key trends (e.g., "Patient reported 4 episodes of fatigue...").
- Mention their current medications if relevant.
- Do NOT include any pleasantries or conversational text. Output ONLY the professional clinical summary paragraph.`;

    const userMessage = `Patient Name: ${req.user.name}\nActive Medications: ${medSummary || 'None'}\n\nPatient Logs (${periodText}):\n${logSummary}`;

    const aiSummary = await callGroqChat(apiKey, systemPrompt, userMessage);

    // Group logs for charting
    const chartData = logs.reduce((acc: any[], log: any) => {
      const date = log.loggedAt.toISOString().split('T')[0];
      const severityScores: Record<string, number> = { 'mild': 1, 'moderate': 2, 'severe': 3 };
      
      const dayData = acc.find(d => d.date === date);
      let maxSeverity = 0;
      
      log.symptoms.forEach((s: any) => {
        const score = severityScores[s.severity?.toLowerCase()] || 0;
        if (score > maxSeverity) maxSeverity = score;
      });

      if (dayData) {
        dayData.symptoms += log.symptoms.length;
        if (maxSeverity > dayData.maxSeverity) dayData.maxSeverity = maxSeverity;
      } else {
        acc.push({
          date,
          symptoms: log.symptoms.length,
          maxSeverity,
        });
      }
      return acc;
    }, []);

    res.json({
      summary: aiSummary,
      chartData,
      period: periodText
    });
  } catch (err: any) {
    console.error('Report Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate report data.' });
  }
});

// POST /api/reports/email - Email the generated PDF
router.post('/email', async (req: AuthRequest, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'PDF data is required.' });

    // pdfBase64 might come with a data URI prefix, so strip it if necessary
    const base64Data = pdfBase64.replace(/^data:application\/pdf;filename=generated\.pdf;base64,/, '');
    
    const attachments = [{
      filename: `Clinical_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      content: base64Data,
      encoding: 'base64',
      contentType: 'application/pdf'
    }];

    const htmlBody = `
      <h2>Your Clinical Report is Ready</h2>
      <p>Hello ${req.user.name},</p>
      <p>Attached is your automated clinical summary for the last 30 days. You can forward this PDF to your healthcare provider.</p>
      <br/>
      <p>Stay healthy!</p>
      <p><b>Did I Take It? App</b></p>
    `;

    const { sent, etherealUrl } = await sendEmail(
      req.user.email,
      'Your Automated Clinical Report',
      htmlBody,
      attachments
    );

    if (sent) {
      res.json({ success: true, etherealUrl });
    } else {
      res.status(500).json({ error: 'Failed to send email.' });
    }
  } catch (err: any) {
    console.error('Email PDF Error:', err);
    res.status(500).json({ error: 'Failed to email the report.' });
  }
});

export default router;
