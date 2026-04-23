import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendDoseTakenEmail } from '../services/email.js';

const router = Router();
router.use(authenticate);

// In-memory medication store
const memoryMeds: any[] = [];
const memoryLogs: any[] = [];

function isDbConnected() { return mongoose.connection.readyState === 1; }

// GET /api/medications
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
      const medications = await Medication.find(query).sort({ createdAt: -1 });
      return res.json(medications);
    }
    const meds = req.user.role === 'admin' ? memoryMeds : memoryMeds.filter(m => m.userId === req.user._id);
    res.json(meds);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch medications.' }); }
});

// POST /api/medications
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const med = new Medication({ ...req.body, userId: req.user._id });
      await med.save();
      return res.status(201).json(med);
    }
    const newMed = { ...req.body, _id: `med-${Date.now()}`, userId: req.user._id, createdAt: new Date().toISOString() };
    memoryMeds.push(newMed);
    res.status(201).json(newMed);
  } catch (err) { res.status(400).json({ error: 'Failed to create medication.' }); }
});

// PATCH /api/medications/:id
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const med = await Medication.findById(req.params.id);
      if (!med) return res.status(404).json({ error: 'Medication not found.' });
      if (med.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
      Object.assign(med, req.body);
      await med.save();
      return res.json(med);
    }
    const idx = memoryMeds.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Medication not found.' });
    memoryMeds[idx] = { ...memoryMeds[idx], ...req.body };
    res.json(memoryMeds[idx]);
  } catch (err) { res.status(400).json({ error: 'Failed to update medication.' }); }
});

// DELETE /api/medications/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      await Medication.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Deleted.' });
    }
    const idx = memoryMeds.findIndex(m => m._id === req.params.id);
    if (idx !== -1) memoryMeds.splice(idx, 1);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete.' }); }
});

// POST /api/medications/:id/log
router.post('/:id/log', async (req: AuthRequest, res) => {
  try {
    const { status, loggedTime, scheduleIndex } = req.body;
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const { DoseLog } = await import('../models/DoseLog.js');
      const med = await Medication.findById(req.params.id);
      if (!med) return res.status(404).json({ error: 'Not found.' });
      if (med.schedule[scheduleIndex]) { med.schedule[scheduleIndex].status = status; med.schedule[scheduleIndex].loggedTime = loggedTime; }
      const takenCount = med.schedule.filter((s: any) => s.status === 'taken').length;
      med.adherence = Math.round((takenCount / med.schedule.length) * 100);
      const nextUp = med.schedule.find((s: any) => s.status === 'upcoming' || s.status === 'due-now');
      med.nextDose = nextUp ? `Next dose ${nextUp.time}` : 'All doses taken for today';
      await med.save();
      await DoseLog.create({ userId: req.user._id, medicationId: med._id, medicationName: med.name, scheduledTime: med.schedule[scheduleIndex]?.time || '', status, loggedAt: new Date() });
      
      let etherealUrl;
      if (status === 'taken') {
        const emailRes = await sendDoseTakenEmail(
          req.user._id.toString(),
          req.user.email,
          req.user.name,
          med.name,
          med.dosage || '1 dose',
          med.schedule[scheduleIndex]?.time || ''
        ).catch(console.error);
        if (emailRes && emailRes.etherealUrl) etherealUrl = emailRes.etherealUrl;
      }
      
      return res.json({ med, etherealUrl });
    }
    const med = memoryMeds.find(m => m._id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Not found.' });
    if (med.schedule[scheduleIndex]) { med.schedule[scheduleIndex].status = status; med.schedule[scheduleIndex].loggedTime = loggedTime; }
    const takenCount = med.schedule.filter((s: any) => s.status === 'taken').length;
    med.adherence = Math.round((takenCount / med.schedule.length) * 100);
    const nextUp = med.schedule.find((s: any) => s.status === 'upcoming' || s.status === 'due-now');
    med.nextDose = nextUp ? `Next dose ${nextUp.time}` : 'All doses taken for today';
    memoryLogs.push({ _id: `log-${Date.now()}`, userId: req.user._id, medicationId: med._id, medicationName: med.name, scheduledTime: med.schedule[scheduleIndex]?.time || '', status, loggedAt: new Date().toISOString() });
    
    let etherealUrl;
    if (status === 'taken') {
      const emailRes = await sendDoseTakenEmail(
        req.user._id.toString(),
        req.user.email,
        req.user.name,
        med.name,
        med.dosage || '1 dose',
        med.schedule[scheduleIndex]?.time || ''
      ).catch(console.error);
      if (emailRes && emailRes.etherealUrl) etherealUrl = emailRes.etherealUrl;
    }
    
    res.json({ med, etherealUrl });
  } catch (err) { res.status(400).json({ error: 'Failed to log dose.' }); }
});

// PATCH /api/medications/:id/schedule/:index
router.patch('/:id/schedule/:index', async (req: AuthRequest, res) => {
  try {
    const { time } = req.body;
    const si = parseInt(req.params.index);
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const med = await Medication.findById(req.params.id);
      if (!med) return res.status(404).json({ error: 'Not found.' });
      if (med.schedule[si]) med.schedule[si].time = time;
      await med.save();
      return res.json(med);
    }
    const med = memoryMeds.find(m => m._id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Not found.' });
    if (med.schedule[si]) med.schedule[si].time = time;
    res.json(med);
  } catch (err) { res.status(400).json({ error: 'Failed to update time.' }); }
});

// GET /api/medications/history/logs
router.get('/history/logs', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { DoseLog } = await import('../models/DoseLog.js');
      const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
      const logs = await DoseLog.find(query).sort({ loggedAt: -1 }).limit(100).populate('userId', 'name email');
      return res.json(logs);
    }
    const logs = req.user.role === 'admin' ? memoryLogs : memoryLogs.filter(l => l.userId === req.user._id);
    res.json(logs.slice(0, 100));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch history.' }); }
});

export default router;
