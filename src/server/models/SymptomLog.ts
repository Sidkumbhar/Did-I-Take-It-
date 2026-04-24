import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rawText: { type: String, required: true },
  symptoms: [{
    name: { type: String, required: true },
    severity: { type: String, default: 'unknown' },
  }],
  timing: { type: String, default: null },
  triggerMedication: { type: String, default: null },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', default: null },
  aiResponse: { type: String, default: null },
  loggedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const SymptomLog = (mongoose.models.SymptomLog as mongoose.Model<any>) || mongoose.model('SymptomLog', SymptomLogSchema);
