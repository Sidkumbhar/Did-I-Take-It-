import mongoose from 'mongoose';

const DoseLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true, index: true },
  medicationName: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  status: { type: String, enum: ['taken', 'missed'], required: true },
  loggedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const DoseLog = (mongoose.models.DoseLog as mongoose.Model<any>) || mongoose.model('DoseLog', DoseLogSchema);
