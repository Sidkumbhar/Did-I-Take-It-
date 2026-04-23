import { useState, useEffect } from 'react';
import { Users, Search, Shield, User } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminUser } from '../types';
import { api } from '../services/api';

export const AdminUsersView = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAdminUsers().then(data => { setUsers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-white/40 text-lg mt-2">{users.length} registered users</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-purple-500/30" />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:grid">
          <div className="col-span-3">User</div><div className="col-span-3">Email</div><div className="col-span-1">Role</div><div className="col-span-1">Meds</div><div className="col-span-2">Adherence</div><div className="col-span-2">Joined</div>
        </div>
        {filtered.map(user => (
          <div key={user._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
            <div className="col-span-1 md:col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">{user.name.charAt(0)}</div>
              <span className="font-bold text-white">{user.name}</span>
            </div>
            <div className="col-span-1 md:col-span-3 text-white/50 text-sm">{user.email}</div>
            <div className="col-span-1 md:col-span-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}{user.role}
              </span>
            </div>
            <div className="col-span-1 md:col-span-1 text-white font-bold">{user.medicationCount}</div>
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${user.avgAdherence}%` }} /></div>
                <span className="text-xs font-bold text-white/50">{user.avgAdherence}%</span>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 text-white/30 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-10 text-center text-white/30">No users found.</div>}
      </div>
    </motion.div>
  );
};
