import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, AlarmClock, Edit2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Medication } from '../types';

export const ScheduleView = ({ medications, onLog, onUpdateTime }: { medications: Medication[], onLog: (medId: string, idx: number, status: string) => void, onUpdateTime: (medId: string, idx: number, newTime: string) => void }) => {
  const [editingDose, setEditingDose] = useState<{ medId: string, idx: number, time: string } | null>(null);
  const adherenceTotal = medications.length > 0 ? Math.round(medications.reduce((acc, med) => acc + med.adherence, 0) / medications.length) : 0;

  const allScheduledDoses = medications.flatMap(med =>
    med.schedule.map((s, idx) => ({ medId: med._id || med.id!, med, s, idx, timeValue: parseInt(s.time.replace(':', '')) }))
  ).sort((a, b) => a.timeValue - b.timeValue);

  const handleSaveTime = () => { if (editingDose) { onUpdateTime(editingDose.medId, editingDose.idx, editingDose.time); setEditingDose(null); } };

  const today = new Date();
  const displayDate = today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold text-on-surface tracking-tight">Today's Schedule</h1>
          <div className="inline-flex items-center gap-3 bg-surface-container-lowest py-2 px-5 rounded-full shadow-sm border border-outline-variant/10">
            <button className="text-on-surface-variant hover:text-primary transition-colors"><ChevronLeft size={20} /></button>
            <span className="font-bold text-primary tracking-tight">{displayDate}</span>
            <button className="text-on-surface-variant hover:text-primary transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-surface-container-low rounded-[40px] p-10 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-[2.4rem] sm:left-[4.4rem] w-[2px] bg-outline-variant/10 -z-0" />
          <div className="space-y-14 relative z-10">
            {allScheduledDoses.length > 0 ? allScheduledDoses.map(({ med, s, idx, medId }) => {
              const isTaken = s.status === 'taken';
              const isMissed = s.status === 'missed';
              const isDue = s.status === 'due-now' || s.status === 'upcoming';
              const isEditing = editingDose?.medId === medId && editingDose?.idx === idx;

              return (
                <div key={`${medId}-${idx}`} className="flex gap-8 group">
                  <div className="w-16 flex-shrink-0 text-right pt-1 flex flex-col items-end gap-2">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        <input type="time" value={editingDose.time} onChange={e => setEditingDose({ ...editingDose, time: e.target.value })} className="bg-white border border-primary/30 rounded-md text-[10px] p-1 font-bold outline-none focus:ring-1 focus:ring-primary w-full" />
                        <button onClick={handleSaveTime} className="bg-primary text-white p-1 rounded-md hover:bg-primary/90 transition-colors"><Check size={10} /></button>
                      </div>
                    ) : (
                      <div className="group/time flex items-center justify-end gap-2">
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDue ? 'text-primary' : 'text-on-surface-variant/70'}`}>{s.time}</span>
                        {!isTaken && <button onClick={() => setEditingDose({ medId, idx, time: s.time })} className="opacity-0 group-hover/time:opacity-100 p-1 text-on-surface-variant hover:text-primary transition-all"><Edit2 size={10} /></button>}
                      </div>
                    )}
                  </div>
                  <div className="relative pt-1.5 text-center">
                    <div className={`w-4 h-4 rounded-full border-4 border-surface-container-low z-20 relative transition-transform group-hover:scale-125 ${isTaken ? 'bg-secondary' : isMissed ? 'bg-error' : isDue ? 'bg-primary ring-4 ring-primary/20' : 'bg-outline-variant'}`}>
                      {isTaken && <CheckCircle2 className="text-white p-0.5" size={14} strokeWidth={4} />}
                    </div>
                  </div>
                  <div className={`flex-1 rounded-3xl p-6 transition-all border border-outline-variant/10 ${isDue ? 'glass-effect shadow-xl' : 'tonal-lift opacity-80 hover:opacity-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xl font-bold ${isDue ? 'text-primary' : 'text-on-surface'}`}>{med.name}</h3>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${isTaken ? 'bg-secondary/10 text-secondary' : isMissed ? 'bg-error text-white' : isDue ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>{s.status}</span>
                    </div>
                    <p className="text-on-surface-variant font-medium text-sm mb-4">{med.dosage} • {med.frequency}</p>
                    {isTaken && <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase"><Clock size={14} /><span>Taken at {s.loggedTime}</span></div>}
                    {!isTaken && !isMissed && (
                      <div className="flex gap-4 mt-6">
                        <button onClick={() => onLog(med._id || med.id!, idx, 'taken')} className="bg-gradient-primary text-white py-3.5 px-8 rounded-2xl flex-1 font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">Take Dose</button>
                        <button className="bg-surface-container-high text-on-surface p-3.5 rounded-2xl hover:bg-surface-container-highest transition-colors"><AlarmClock size={20} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : <div className="py-20 text-center"><p className="text-on-surface-variant text-lg">No doses scheduled for today.</p></div>}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="tonal-lift rounded-[40px] p-8 space-y-8">
            <h2 className="text-2xl font-bold text-on-surface">Summary</h2>
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-surface-container-low/50 border border-outline-variant/10">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#E6E8EB" strokeWidth="8" />
                  <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#005da7" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - adherenceTotal / 100)} strokeWidth="8" />
                </svg>
                <div className="absolute flex flex-col items-center"><span className="text-xl font-bold text-primary">{adherenceTotal}%</span></div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Adherence</p>
                <p className="text-3xl font-extrabold text-on-surface">{adherenceTotal}%</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};
