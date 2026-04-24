import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

function isDbConnected() { return mongoose.connection.readyState === 1; }

// In-memory fallback
const memorySymptomLogs: any[] = [];

async function buildSystemPrompt(user: any) {
  let userMeds: any[] = [];
  if (isDbConnected()) {
    const { Medication } = await import('../models/Medication.js');
    userMeds = await Medication.find({ userId: user._id });
  }

  const medContext = userMeds.length > 0
    ? `The patient is currently taking: ${userMeds.map((m: any) => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ')}.`
    : 'No medications currently tracked in the system.';

  return `You are Dr. AI, a friendly and knowledgeable virtual medical assistant inside a medication tracking app called "Did I Take It?".

Your role:
- Help users understand their symptoms and medications
- Provide general health guidance (always remind them to consult a real doctor for serious concerns)
- Answer questions about drug interactions, side effects, and dosage timing
- Be empathetic, warm, and conversational
- Keep responses concise (2-4 short paragraphs max) — this is a chat, not an essay
- Use simple language, avoid excessive medical jargon
- DO NOT ask the user for the name or details of their medications. Their active medications are provided in the Patient Context below. If they mention "my medicine", infer it from this list. If they have multiple, ask them to clarify which one from the list.
- If the user describes serious symptoms (chest pain, difficulty breathing, severe allergic reactions), ALWAYS recommend seeking immediate medical attention

Patient context:
- Name: ${user.name}
${medContext}

IMPORTANT: You are NOT a replacement for a real doctor. Always include a brief disclaimer when giving medical advice. Start your very first response with a warm greeting.`;
}

// Helper to call Groq Chat Completions API (OpenAI compatible)
async function callGroqChat(apiKey: string, systemPrompt: string, history: any[], userMessage: string) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text })),
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // Fast and smart free model from Meta
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { status: response.status, message: errorData?.error?.message || 'Failed to call Groq' };
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper to call Groq Whisper API for audio transcription
async function callGroqWhisper(apiKey: string, audioBase64: string, mimeType: string) {
  const buffer = Buffer.from(audioBase64, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg';
  
  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-large-v3-turbo');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { status: response.status, message: errorData?.error?.message || 'Failed to transcribe audio with Groq Whisper' };
  }

  const data = await response.json();
  return data.text;
}

// POST /api/voice-log/chat — Text-based AI Doctor chat
router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured. Add GROQ_API_KEY to your .env.local file.' });
    }

    const systemPrompt = await buildSystemPrompt(req.user);
    const aiText = await callGroqChat(apiKey, systemPrompt, history || [], message.trim());

    if (isDbConnected()) {
      const { SymptomLog } = await import('../models/SymptomLog.js');
      await SymptomLog.create({
        userId: req.user._id,
        rawText: message.trim(),
        symptoms: [],
        timing: null,
        triggerMedication: null,
        medicationId: null,
        aiResponse: aiText,
        loggedAt: new Date(),
      });
    }

    res.json({ response: aiText });
  } catch (err: any) {
    console.error('AI Doctor text error:', err);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Groq rate limit reached. Please wait a few seconds.' });
    }
    res.status(500).json({ error: err.message || 'Failed to get AI response. Please try again.' });
  }
});

// POST /api/voice-log/audio — Audio-based AI Doctor chat
router.post('/audio', async (req: AuthRequest, res) => {
  try {
    const { audio, mimeType, history } = req.body;
    if (!audio) return res.status(400).json({ error: 'Audio data is required.' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured. Add GROQ_API_KEY to your .env.local file.' });
    }

    const systemPrompt = await buildSystemPrompt(req.user);

    // 1. Transcribe audio with Whisper
    const transcript = await callGroqWhisper(apiKey, audio, mimeType || 'audio/webm');
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'No speech was detected in the audio recording.' });
    }

    // 2. Get AI Response with Llama 3
    const aiText = await callGroqChat(apiKey, systemPrompt, history || [], transcript);

    if (isDbConnected()) {
      const { SymptomLog } = await import('../models/SymptomLog.js');
      await SymptomLog.create({
        userId: req.user._id,
        rawText: transcript,
        symptoms: [],
        timing: null,
        triggerMedication: null,
        medicationId: null,
        aiResponse: aiText,
        loggedAt: new Date(),
      });
    }

    res.json({ response: aiText, transcript });
  } catch (err: any) {
    console.error('AI Doctor audio error:', err);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Groq rate limit reached. Please wait a few seconds.' });
    }
    res.status(500).json({ error: err.message || 'Failed to process audio. Please try again.' });
  }
});

// GET /api/voice-log — Get conversation history
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { SymptomLog } = await import('../models/SymptomLog.js');
      const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
      const logs = await SymptomLog.find(query)
        .sort({ loggedAt: -1 })
        .limit(50)
        .populate('medicationId', 'name dosage');
      return res.json(logs);
    }
    const logs = req.user.role === 'admin'
      ? memorySymptomLogs
      : memorySymptomLogs.filter(l => l.userId === req.user._id);
    res.json(logs.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

export default router;
