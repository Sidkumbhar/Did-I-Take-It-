import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.js';
import { sendWelcomeEmail, setupEmail } from '../services/email.js';

const router = Router();

// In-memory user store for when MongoDB is not available
const memoryUsers: any[] = [];
let memoryInitialized = false;

function initMemoryStore() {
  if (memoryInitialized) return;
  memoryInitialized = true;
  const salt = bcrypt.genSaltSync(12);
  memoryUsers.push({
    _id: 'admin-001',
    name: 'Admin',
    email: 'admin@diditakeit.com',
    password: bcrypt.hashSync('admin123', salt),
    role: 'admin',
    streak: 0,
    notificationsEnabled: true,
  });
  memoryUsers.push({
    _id: 'user-001',
    name: 'Demo User',
    email: 'user@demo.com',
    password: bcrypt.hashSync('demo123', salt),
    role: 'user',
    streak: 5,
    notificationsEnabled: true,
  });
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function findUserByEmail(email: string) {
  if (isDbConnected()) {
    const { User } = await import('../models/User.js');
    return User.findOne({ email: email.toLowerCase() });
  }
  initMemoryStore();
  return memoryUsers.find(u => u.email === email.toLowerCase()) || null;
}

async function findUserById(id: string) {
  if (isDbConnected()) {
    const { User } = await import('../models/User.js');
    return User.findById(id).select('-password');
  }
  initMemoryStore();
  const u = memoryUsers.find(u => u._id === id);
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    if (isDbConnected()) {
      const { User } = await import('../models/User.js');
      const user = new User({ name, email: email.toLowerCase(), password });
      await user.save();
      const token = generateToken(user._id.toString(), user.role);
      sendWelcomeEmail(user._id.toString(), user.email, user.name).catch(console.error);
      return res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, streak: user.streak, notificationsEnabled: user.notificationsEnabled } });
    }

    // In-memory fallback
    initMemoryStore();
    const salt = bcrypt.genSaltSync(12);
    const newUser = {
      _id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password: bcrypt.hashSync(password, salt),
      role: 'user' as const,
      streak: 0,
      notificationsEnabled: true,
    };
    memoryUsers.push(newUser);
    const token = generateToken(newUser._id, newUser.role);
    res.status(201).json({ token, user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, streak: newUser.streak, notificationsEnabled: newUser.notificationsEnabled } });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    if (isDbConnected()) {
      const { User } = await import('../models/User.js');
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });
      const token = generateToken(user._id.toString(), user.role);
      return res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, streak: user.streak, notificationsEnabled: user.notificationsEnabled } });
    }

    // In-memory fallback
    initMemoryStore();
    const user = memoryUsers.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = generateToken(user._id, user.role);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, streak: user.streak, notificationsEnabled: user.notificationsEnabled } });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, streak: req.user.streak || 0, notificationsEnabled: req.user.notificationsEnabled !== false } });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch user.' }); }
});

// PATCH /api/auth/me
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, notificationsEnabled } = req.body;
    if (isDbConnected()) {
      const { User } = await import('../models/User.js');
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
      return res.json({ user });
    }
    // Memory fallback
    const idx = memoryUsers.findIndex(u => u._id === req.user._id);
    if (idx !== -1) {
      if (name !== undefined) memoryUsers[idx].name = name;
      if (notificationsEnabled !== undefined) memoryUsers[idx].notificationsEnabled = notificationsEnabled;
      const { password, ...userWithout } = memoryUsers[idx];
      return res.json({ user: userWithout });
    }
    res.status(404).json({ error: 'User not found.' });
  } catch (err) { res.status(500).json({ error: 'Failed to update profile.' }); }
});

// POST /api/auth/setup-env
router.post('/setup-env', async (req, res) => {
  try {
    const { emailUser, emailPass, mongodbUri } = req.body;
    
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or append values
    if (emailUser) {
      if (envContent.includes('EMAIL_USER=')) envContent = envContent.replace(/EMAIL_USER=.*/g, `EMAIL_USER="${emailUser}"`);
      else envContent += `\nEMAIL_USER="${emailUser}"`;
    }
    if (emailPass) {
      if (envContent.includes('EMAIL_PASS=')) envContent = envContent.replace(/EMAIL_PASS=.*/g, `EMAIL_PASS="${emailPass}"`);
      else envContent += `\nEMAIL_PASS="${emailPass}"`;
    }
    if (mongodbUri) {
      if (envContent.includes('MONGODB_URI=')) envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI="${mongodbUri}"`);
      else envContent += `\nMONGODB_URI="${mongodbUri}"`;
    }
    
    // Write back to .env.local
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    // Dynamically update the email service running in memory
    if (emailUser || emailPass) {
      await setupEmail(emailUser, emailPass);
    }
    
    res.json({ message: 'Environment variables updated successfully.' });
  } catch (err) {
    console.error('Failed to setup env:', err);
    res.status(500).json({ error: 'Failed to update environment configuration.' });
  }
});

export default router;
