import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    email: process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com' ? 'configured' : 'not configured',
  });
});

// MongoDB Connection (graceful - app works without it using in-memory fallback)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/did-i-take-it';
let dbConnected = false;

try {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  });
  dbConnected = true;
  console.log('✅ Connected to standard MongoDB');
} catch (err: any) {
  console.warn('⚠️  Standard MongoDB connection failed:', err.message);
  console.log('🚀 Starting in-memory MongoDB Server fallback...');
  
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, { dbName: 'did-i-take-it' });
    dbConnected = true;
    console.log(`✅ Connected to in-memory MongoDB at ${mongoUri}`);
    console.log('   Note: Data will be lost when the server restarts.');
  } catch (memErr: any) {
    console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
    console.warn('⚠️  Running in DEMO MODE with limited array-based fallback.');
  }
}

if (dbConnected) {
  try {
    // Seed admin account if none exists
    const { User } = await import('./src/server/models/User.js');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@diditakeit.com',
        password: 'admin123',
        role: 'admin',
      });
      await admin.save();
      console.log('👑 Default admin account created: admin@diditakeit.com / admin123');
    }
  } catch (seedErr: any) {
    console.error('Failed to seed admin account:', seedErr.message);
  }
}

// Import and mount routes (they handle both DB and fallback modes)
const authRoutes = (await import('./src/server/routes/auth.js')).default;
const medicationRoutes = (await import('./src/server/routes/medications.js')).default;
const adminRoutes = (await import('./src/server/routes/admin.js')).default;
const voiceLogRoutes = (await import('./src/server/routes/voicelog.js')).default;
const reportRoutes = (await import('./src/server/routes/reports.js')).default;

app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voice-log', voiceLogRoutes);
app.use('/api/reports', reportRoutes);

// Start background scheduler only if DB is connected
if (dbConnected) {
  const { startScheduler } = await import('./src/server/services/scheduler.js');
  startScheduler();
}

// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  if (!dbConnected) {
    console.log('📌 Note: Running without MongoDB. Auth will use in-memory store.');
  }
});
