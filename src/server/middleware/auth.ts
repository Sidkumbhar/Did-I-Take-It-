import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'did-i-take-it-fallback-secret';

export interface AuthRequest extends Request {
  user?: any;
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (mongoose.connection.readyState === 1) {
      const { User } = await import('../models/User.js');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ error: 'User not found.' });
      req.user = user;
    } else {
      // In-memory mode: construct user from token
      req.user = { _id: decoded.id, role: decoded.role, name: decoded.role === 'admin' ? 'Admin' : 'User', email: '', streak: 0, notificationsEnabled: true };
    }
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired. Please log in again.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}
