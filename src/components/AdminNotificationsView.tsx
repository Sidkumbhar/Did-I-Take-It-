import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationLog } from '../types';
import { api } from '../services/api';

export const AdminNotificationsView = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');

  useEffect(() => {
    api.getAdminNotifications().then(data => { setNotifications(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = notifications.filter(n => filter === 'all' || n.status === filter);

  const typeLabels: Record<string, { label: string; color: string }> = {
    dose_reminder: { label: 'Reminder', color: 'bg-blue-500/20 text-blue-300' },
    missed_alert: { label: 'Missed', color: 'bg-red-500/20 text-red-300' },
    welcome: { label: 'Welcome', color: 'bg-emerald-500/20 text-emerald-300' },
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Notification Logs</h1>
        <p className="text-white/40 text-lg mt-2">Email notification history across all users.</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'sent', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="text-white/20" size={40} /></div>
          <p className="text-white/30 text-lg">No notifications logged yet.</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:grid">
            <div className="col-span-2">Type</div><div className="col-span-3">Recipient</div><div className="col-span-3">Subject</div><div className="col-span-2">Status</div><div className="col-span-2">Sent At</div>
          </div>
          {filtered.map(notif => (
            <div key={notif._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
              <div className="col-span-1 md:col-span-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeLabels[notif.type]?.color || 'bg-white/10 text-white/50'}`}>
                  {typeLabels[notif.type]?.label || notif.type}
                </span>
              </div>
              <div className="col-span-1 md:col-span-3 text-white/50 text-sm">{typeof notif.userId === 'object' ? notif.userId.email : notif.userId}</div>
              <div className="col-span-1 md:col-span-3 text-white text-sm font-medium truncate">{notif.subject}</div>
              <div className="col-span-1 md:col-span-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${notif.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {notif.status === 'sent' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{notif.status}
                </span>
              </div>
              <div className="col-span-1 md:col-span-2 text-white/30 text-sm">{new Date(notif.sentAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
