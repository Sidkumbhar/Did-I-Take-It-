import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  nextDose: { type: String, required: true },
  status: { type: String, enum: ['active', 'paused', 'as-needed'], default: 'active' },
  adherence: { type: Number, default: 0, min: 0, max: 100 },
  type: { type: String, enum: ['pill', 'capsule', 'liquid', 'injection'], default: 'pill' },
  color: { type: String, default: '#005da7' },
  schedule: [{
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'missed', 'upcoming', 'due-now'], default: 'upcoming' },
    loggedTime: { type: String }
  }]
}, { timestamps: true });

export const Medication = (mongoose.models.Medication as mongoose.Model<any>) || mongoose.model('Medication', MedicationSchema);
