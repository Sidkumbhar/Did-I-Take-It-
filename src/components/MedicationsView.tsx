import { useState } from 'react';
import { Pill, Plus, Search, Edit2, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Medication } from '../types';

export const MedicationsView = ({ medications, onAddClick, onEditClick }: { medications: Medication[], onAddClick: () => void, onEditClick: (med: Medication) => void }) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Paused' | 'As Needed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedications = medications.filter(med => {
    const matchesFilter = filter === 'All' || (filter === 'Active' && med.status === 'active') || (filter === 'Paused' && med.status === 'paused') || (filter === 'As Needed' && med.status === 'as-needed');
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">My Medications</h1>
          <p className="text-on-surface-variant text-lg mt-2 font-medium max-w-2xl">Manage your prescriptions, dosages, and daily adherence schedules.</p>
        </div>
        <button onClick={onAddClick} className="bg-gradient-primary text-on-primary px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95">
          <Plus size={18} />Add New
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/15">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(['All', 'Active', 'Paused', 'As Needed'] as const).map(label => (
            <button key={label} onClick={() => setFilter(label)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === label ? 'bg-primary text-white shadow-md' : 'hover:bg-surface-container-low text-on-surface-variant'}`}>{label}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input type="text" placeholder="Search medications..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-0 text-on-surface outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedications.length > 0 ? filteredMedications.map(med => (
          <div key={med._id || med.id} className="tonal-lift rounded-3xl p-6 flex flex-col gap-6 relative group transition-all duration-300 hover:shadow-xl hover:shadow-on-surface/5 border border-outline-variant/5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${med.color}15`, color: med.color }}><Pill size={24} strokeWidth={2.5} /></div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight">{med.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${med.status === 'active' ? 'bg-secondary/10 text-secondary' : med.status === 'paused' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${med.status === 'active' ? 'bg-secondary' : med.status === 'paused' ? 'bg-on-surface-variant' : 'bg-tertiary'}`} />{med.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">{med.dosage.replace(/\D/g, '')}</span>
                <span className="text-on-surface-variant text-sm font-bold uppercase">{med.dosage.replace(/\d/g, '')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-widest">Frequency</p>
                  <p className="text-xs font-bold text-on-surface">{med.frequency}</p>
                </div>
                <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-widest">Next Dose</p>
                  <p className="text-xs font-bold text-on-surface">{med.nextDose}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-on-surface-variant">7-Day Adherence</span><span className="text-secondary">{med.adherence}%</span>
                </div>
                <div className="flex gap-1.5 h-1.5">
                  {[1,2,3,4,5,6,7].map(day => (<div key={day} className={`flex-1 rounded-full transition-all duration-1000 ${day <= Math.ceil(med.adherence / 14) ? 'bg-secondary' : 'bg-surface-container-highest'}`} />))}
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-outline-variant/15 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEditClick(med)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors" title="Edit"><Edit2 size={18} /></button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors"><Settings size={18} /></button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant opacity-20"><Pill size={32} /></div>
            <p className="text-on-surface-variant font-medium">No medications found matching your criteria.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
