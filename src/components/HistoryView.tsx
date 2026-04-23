import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { DoseLog } from '../types';
import { api } from '../services/api';

export const HistoryView = () => {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'taken' | 'missed'>('all');

  useEffect(() => {
    api.getDoseHistory().then(data => { setLogs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(l => filter === 'all' || l.status === filter);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div>
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Dose History</h1>
        <p className="text-on-surface-variant text-lg mt-2 font-medium">Track your medication adherence over time.</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'taken', 'missed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant/15'}`}>{f}</button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant opacity-20"><BarChart3 size={40} /></div>
          <h2 className="text-2xl font-bold text-on-surface">No dose history yet</h2>
          <p className="text-on-surface-variant">Start logging doses to see your history here.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/10 bg-surface-container-low/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:grid">
            <div className="col-span-4">Medication</div><div className="col-span-2">Scheduled</div><div className="col-span-2">Status</div><div className="col-span-4">Logged At</div>
          </div>
          {filteredLogs.map(log => (
            <div key={log._id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 items-center border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors last:border-0">
              <div className="col-span-1 sm:col-span-4 font-bold text-on-surface">{log.medicationName}</div>
              <div className="col-span-1 sm:col-span-2 text-sm text-on-surface-variant flex items-center gap-1"><Clock size={14} />{log.scheduledTime}</div>
              <div className="col-span-1 sm:col-span-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.status === 'taken' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                  {log.status === 'taken' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{log.status}
                </span>
              </div>
              <div className="col-span-1 sm:col-span-4 text-sm text-on-surface-variant">{new Date(log.loggedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
