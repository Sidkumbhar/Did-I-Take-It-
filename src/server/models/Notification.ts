import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['dose_reminder', 'missed_alert', 'welcome', 'dose_taken'], required: true },
  subject: { type: String, required: true },
  body: { type: String },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String },
}, { timestamps: true });

export const Notification = (mongoose.models.Notification as mongoose.Model<any>) || mongoose.model('Notification', NotificationSchema);
