import cron from 'node-cron';
import { Medication } from '../models/Medication.js';
import { User } from '../models/User.js';
import { DoseLog } from '../models/DoseLog.js';
import { sendDoseReminder, sendMissedAlert } from './email.js';

// Track which doses we've already sent reminders for (to avoid duplicates within a session)
const remindedDoses = new Set<string>();

export function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${HH}:${mm}`;
      const today = now.toDateString();

      // Find all active medications
      const medications = await Medication.find({ status: 'active' });

      for (const med of medications) {
        const user = await User.findById(med.userId);
        if (!user || !user.notificationsEnabled) continue;

        for (let idx = 0; idx < med.schedule.length; idx++) {
          const dose = med.schedule[idx];
          const doseKey = `${med._id}-${idx}-${today}`;

          // Send reminder when dose time arrives
          if (dose.time === currentTime && dose.status !== 'taken' && !remindedDoses.has(doseKey)) {
            remindedDoses.add(doseKey);
            await sendDoseReminder(
              user._id.toString(),
              user.email,
              user.name,
              med.name,
              med.dosage,
              dose.time
            );

            // Update dose status to 'due-now'
            med.schedule[idx].status = 'due-now';
            await med.save();
          }

          // Mark as missed if 30+ minutes past due and not taken
          if (dose.status === 'due-now' || dose.status === 'upcoming') {
            const [doseH, doseM] = dose.time.split(':').map(Number);
            const doseMinutes = doseH * 60 + doseM;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Handle midnight wraparound (e.g. dose at 23:45, current time 00:15)
            let diff = currentMinutes - doseMinutes;
            if (diff < 0) diff += 1440; // 24 * 60 = 1440 minutes in a day

            if (diff >= 30 && diff < 31) {
              const missedKey = `missed-${doseKey}`;
              if (!remindedDoses.has(missedKey)) {
                remindedDoses.add(missedKey);
                
                // Mark as missed
                med.schedule[idx].status = 'missed';
                await med.save();

                // Create dose log
                await DoseLog.create({
                  userId: user._id,
                  medicationId: med._id,
                  medicationName: med.name,
                  scheduledTime: dose.time,
                  status: 'missed',
                });

                // Recalculate adherence
                const takenCount = med.schedule.filter((s: any) => s.status === 'taken').length;
                med.adherence = Math.round((takenCount / med.schedule.length) * 100);
                await med.save();

                // Send missed alert
                await sendMissedAlert(
                  user._id.toString(),
                  user.email,
                  user.name,
                  med.name,
                  med.dosage,
                  dose.time
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });

  console.log('⏰ Background dose scheduler started (checks every minute)');

  // Clear reminded doses at midnight
  cron.schedule('0 0 * * *', () => {
    remindedDoses.clear();
    console.log('🔄 Cleared daily reminder cache');
  });
}
