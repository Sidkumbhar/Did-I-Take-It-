import { useState } from 'react';
import { Plus, CheckCircle2, Pill, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Medication, UserData } from '../types';

export const DashboardView = ({ medications, onAddClick, onLog, user }: { medications: Medication[], onAddClick: () => void, onLog: (medId: string, idx: number, status: string) => void, user: UserData }) => {
  const dosesTotal = medications.reduce((acc, med) => acc + med.schedule.length, 0);
  const dosesTaken = medications.reduce((acc, med) => acc + med.schedule.filter(s => s.status === 'taken').length, 0);
  const dosesMissed = medications.reduce((acc, med) => acc + med.schedule.filter(s => s.status === 'missed').length, 0);
  const dailyAdherence = dosesTotal > 0 ? Math.round((dosesTaken / dosesTotal) * 100) : 0;
  const adherenceTotal = medications.length > 0 ? Math.round(medications.reduce((acc, med) => acc + med.adherence, 0) / medications.length) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const handleQuickLog = (status: 'taken' | 'missed' = 'taken') => {
    for (const med of medications) {
      const dueIdx = med.schedule.findIndex(s => s.status === 'due-now' || s.status === 'upcoming');
      if (dueIdx !== -1) { onLog(med._id || med.id!, dueIdx, status); return; }
    }
  };

  const isAllLogged = dosesTotal > 0 && (dosesTaken + dosesMissed === dosesTotal);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">{greeting}, {user.name} 👋</h1>
          <p className="text-lg text-on-surface-variant mt-2 leading-relaxed">{displayDate} · Here's your medication overview</p>
        </div>
        <button onClick={onAddClick} className="bg-gradient-primary text-on-primary px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <Plus size={18} />Add Medication
        </button>
      </div>

      {/* Daily Check-in */}
      <section className="glass-effect rounded-3xl p-8 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl -z-10" />
        <div className="flex-1">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">Daily Check-in</span>
          {isAllLogged ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-3xl font-bold text-on-surface mb-2">You're all set for today! ✨</h2>
              <p className="text-on-surface-variant text-lg mb-8">All {dosesTotal} doses have been logged.</p>
              <button className="bg-primary/10 text-primary px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center gap-2 cursor-default">
                <ShieldCheck size={20} />Complete
              </button>
            </motion.div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-on-surface mb-2">Did you take your medication today?</h2>
              <p className="text-on-surface-variant text-lg mb-8">{dosesTaken} of {dosesTotal} doses logged</p>
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => handleQuickLog('taken')} className="bg-secondary text-white px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2">
                  <CheckCircle2 size={20} />Yes, Taken!
                </button>
                <button onClick={() => handleQuickLog('missed')} className="bg-surface-container-highest/50 text-on-surface px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider hover:bg-surface-container-highest transition-all active:scale-95">Not Yet</button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-8 bg-surface-container-lowest/50 p-6 rounded-2xl border border-outline-variant/15 backdrop-blur-sm">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-container-low" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
              <circle className="text-secondary transition-all duration-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - dailyAdherence / 100)} strokeLinecap="round" strokeWidth="8" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center"><span className="text-2xl font-bold text-on-surface tracking-tight">{dailyAdherence}%</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm font-medium text-on-surface-variant font-mono">{dosesTaken} Taken</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm font-medium text-on-surface-variant font-mono">{dosesTotal - dosesTaken - dosesMissed} Due</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-error" /><span className="text-sm font-medium text-on-surface-variant font-mono">{dosesMissed} Missed</span></div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Current Streak', val: user.streak, unit: 'days', color: 'bg-tertiary-fixed-dim' },
          { label: 'Weekly Adherence', val: adherenceTotal, unit: '%', color: 'bg-secondary' },
          { label: 'Total Taken', val: dosesTaken, unit: 'doses', color: 'bg-primary' },
          { label: 'Missed', val: dosesMissed, unit: 'doses', color: 'bg-outline-variant' }
        ].map((stat, i) => (
          <div key={i} className="tonal-lift rounded-2xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${stat.color}`} />
            <p className="text-sm font-medium text-on-surface-variant mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-on-surface">{stat.val}</span>
              <span className="text-sm text-on-surface-variant font-medium">{stat.unit}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Upcoming Doses */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xl font-bold text-on-surface">Upcoming Doses</h3>
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/10 bg-surface-container-low/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:grid">
            <div className="col-span-5">Medication</div><div className="col-span-3">Scheduled</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Action</div>
          </div>
          <div className="flex flex-col">
            {medications.length === 0 && <div className="p-10 text-center text-on-surface-variant">No medications yet. Add one to get started!</div>}
            {medications.map(med => med.schedule.map((s, idx) => (
              <div key={`${med._id}-${idx}`} className={`grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 items-center border-b border-outline-variant/5 transition-all last:border-0 ${s.status === 'due-now' ? 'bg-[#ff6b00]/5 hover:bg-[#ff6b00]/10 border-l-4 border-l-[#ff6b00]' : 'hover:bg-surface-container-low/30 border-l-4 border-l-transparent'}`}>
                <div className="col-span-1 sm:col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant"><Pill size={24} /></div>
                  <div><h4 className="text-base font-bold text-on-surface">{med.name}</h4><p className="text-sm text-on-surface-variant">{med.dosage} · {med.frequency}</p></div>
                </div>
                <div className="col-span-1 sm:col-span-3"><span className="text-sm font-medium text-on-surface">{s.time}</span></div>
                <div className="col-span-1 sm:col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === 'taken' ? 'bg-secondary-container/30 text-secondary' : s.status === 'missed' ? 'bg-error/10 text-error' : s.status === 'due-now' ? 'bg-[#ff6b00]/20 text-[#ff6b00] animate-pulse' : 'bg-primary/10 text-primary'}`}>
                    {s.status === 'taken' && <CheckCircle2 size={12} />}{s.status}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2 text-right">
                  {s.status !== 'taken' ? (
                    <button onClick={() => onLog(med._id || med.id!, idx, 'taken')} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">Log Dose</button>
                  ) : (
                    <span className="text-xs text-on-surface-variant opacity-40 font-bold uppercase">Logged</span>
                  )}
                </div>
              </div>
            ))).flat()}
          </div>
        </div>
      </section>
    </motion.div>
  );
};
