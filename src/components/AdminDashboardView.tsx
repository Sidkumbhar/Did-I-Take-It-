import { useState, useEffect } from 'react';
import { Users, Pill, Activity, Mail, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminStats } from '../types';
import { api } from '../services/api';

export const AdminDashboardView = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(data => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-500/20' },
    { label: 'Total Medications', value: stats.totalMedications, icon: Pill, color: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-500/20' },
    { label: 'Avg Adherence', value: `${stats.avgAdherence}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-500/20' },
    { label: 'Emails Sent', value: stats.emailsSent, icon: Mail, color: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-500/20' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-white/40 text-lg mt-2 font-medium">Platform-wide overview and statistics.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <p className="text-sm font-medium text-white/40 mb-1">{stat.label}</p>
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity size={20} className="text-purple-400" />Today's Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={20} /><span className="text-white/70 font-medium">Doses Taken</span></div>
              <span className="text-2xl font-bold text-emerald-400">{stats.todayTaken}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-white/70 font-medium">Doses Missed</span></div>
              <span className="text-2xl font-bold text-red-400">{stats.todayMissed}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3"><Activity className="text-purple-400" size={20} /><span className="text-white/70 font-medium">Total Dose Logs</span></div>
              <span className="text-2xl font-bold text-purple-400">{stats.totalDoseLogs}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Mail size={20} className="text-purple-400" />Email Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-white/70 font-medium">Sent Successfully</span>
              <span className="text-2xl font-bold text-emerald-400">{stats.emailsSent}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-white/70 font-medium">Failed</span>
              <span className="text-2xl font-bold text-red-400">{stats.emailsFailed}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-white/70 font-medium">Total Notifications</span>
              <span className="text-2xl font-bold text-white">{stats.totalNotifications}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
