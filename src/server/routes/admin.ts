import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

function isDbConnected() { return mongoose.connection.readyState === 1; }

// GET /api/admin/stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { User } = await import('../models/User.js');
      const { Medication } = await import('../models/Medication.js');
      const { DoseLog } = await import('../models/DoseLog.js');
      const { Notification } = await import('../models/Notification.js');

      const totalUsers = await User.countDocuments({ role: 'user' });
      const totalMedications = await Medication.countDocuments();
      const totalDoseLogs = await DoseLog.countDocuments();
      const totalNotifications = await Notification.countDocuments();
      const medications = await Medication.find();
      const avgAdherence = medications.length > 0 ? Math.round(medications.reduce((acc, m) => acc + (m.adherence || 0), 0) / medications.length) : 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayTaken = await DoseLog.countDocuments({ loggedAt: { $gte: today }, status: 'taken' });
      const todayMissed = await DoseLog.countDocuments({ loggedAt: { $gte: today }, status: 'missed' });
      const emailsSent = await Notification.countDocuments({ status: 'sent' });
      const emailsFailed = await Notification.countDocuments({ status: 'failed' });

      return res.json({ totalUsers, totalMedications, totalDoseLogs, totalNotifications, avgAdherence, todayLogs: todayTaken + todayMissed, todayTaken, todayMissed, emailsSent, emailsFailed });
    }
    // Demo stats
    res.json({ totalUsers: 1, totalMedications: 0, totalDoseLogs: 0, totalNotifications: 0, avgAdherence: 0, todayLogs: 0, todayTaken: 0, todayMissed: 0, emailsSent: 0, emailsFailed: 0 });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch stats.' }); }
});

// GET /api/admin/users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { User } = await import('../models/User.js');
      const { Medication } = await import('../models/Medication.js');
      const { DoseLog } = await import('../models/DoseLog.js');
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      const enriched = await Promise.all(users.map(async user => {
        const meds = await Medication.find({ userId: user._id });
        const avgAdherence = meds.length > 0 ? Math.round(meds.reduce((a, m) => a + (m.adherence || 0), 0) / meds.length) : 0;
        const doseLogCount = await DoseLog.countDocuments({ userId: user._id });
        return { ...user.toObject(), medicationCount: meds.length, avgAdherence, doseLogCount };
      }));
      return res.json(enriched);
    }
    res.json([{ _id: 'user-001', name: 'Demo User', email: 'user@demo.com', role: 'user', streak: 5, notificationsEnabled: true, medicationCount: 0, avgAdherence: 0, doseLogCount: 0, createdAt: new Date().toISOString() }]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users.' }); }
});

// GET /api/admin/medications
router.get('/medications', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Medication } = await import('../models/Medication.js');
      const medications = await Medication.find().populate('userId', 'name email').sort({ createdAt: -1 });
      return res.json(medications);
    }
    res.json([]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch medications.' }); }
});

// GET /api/admin/notifications
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    if (isDbConnected()) {
      const { Notification } = await import('../models/Notification.js');
      const notifications = await Notification.find().populate('userId', 'name email').sort({ sentAt: -1 }).limit(200);
      return res.json(notifications);
    }
    res.json([]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notifications.' }); }
});

export default router;
