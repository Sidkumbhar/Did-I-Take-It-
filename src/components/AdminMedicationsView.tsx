import { useState, useEffect } from 'react';
import { Pill, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Medication } from '../types';
import { api } from '../services/api';

export const AdminMedicationsView = () => {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAdminMedications().then(data => { setMedications(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = medications.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.userId?.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">All Medications</h1>
          <p className="text-white/40 text-lg mt-2">{medications.length} medications across all users</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input type="text" placeholder="Search by name or user..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-purple-500/30" />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:grid">
          <div className="col-span-3">Medication</div><div className="col-span-2">User</div><div className="col-span-2">Dosage</div><div className="col-span-2">Status</div><div className="col-span-3">Adherence</div>
        </div>
        {filtered.map(med => (
          <div key={med._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
            <div className="col-span-1 md:col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${med.color}20`, color: med.color }}><Pill size={20} /></div>
              <div><p className="font-bold text-white">{med.name}</p><p className="text-xs text-white/30">{med.frequency}</p></div>
            </div>
            <div className="col-span-1 md:col-span-2 text-white/50 text-sm">{med.userId?.name || 'Unknown'}</div>
            <div className="col-span-1 md:col-span-2 text-white font-bold">{med.dosage}</div>
            <div className="col-span-1 md:col-span-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${med.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : med.status === 'paused' ? 'bg-white/10 text-white/50' : 'bg-amber-500/20 text-amber-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${med.status === 'active' ? 'bg-emerald-400' : med.status === 'paused' ? 'bg-white/40' : 'bg-amber-400'}`} />{med.status}
              </span>
            </div>
            <div className="col-span-1 md:col-span-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${med.adherence}%` }} /></div>
                <span className="text-xs font-bold text-white/50 w-10 text-right">{med.adherence}%</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-10 text-center text-white/30">No medications found.</div>}
      </div>
    </motion.div>
  );
};
