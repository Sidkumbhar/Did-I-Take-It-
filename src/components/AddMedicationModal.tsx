import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Medication } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Partial<Medication>) => void;
  initialData?: Medication | null;
  mode: 'add' | 'edit';
}

export const MedicationModal = ({ isOpen, onClose, onSave, initialData, mode }: Props) => {
  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || '1x Daily');
  const [time, setTime] = useState(initialData?.schedule[0]?.time || '08:00');
  const [nextDoseTime, setNextDoseTime] = useState(initialData?.nextDose?.split(', ')[1] || '08:00');
  const [type, setType] = useState<'pill' | 'capsule' | 'liquid' | 'injection'>(initialData?.type || 'pill');
  const [color, setColor] = useState(initialData?.color || '#005da7');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDosage(initialData.dosage);
      setFrequency(initialData.frequency);
      setTime(initialData.schedule[0]?.time || '08:00');
      setNextDoseTime(initialData.nextDose?.split(', ')[1] || '08:00');
      setType(initialData.type);
      setColor(initialData.color);
    } else {
      setName('');
      setDosage('');
      setFrequency('1x Daily');
      setTime('08:00');
      setNextDoseTime('08:00');
      setType('pill');
      setColor('#005da7');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      dosage,
      frequency,
      status: initialData?.status || 'active',
      adherence: initialData?.adherence || 0,
      type,
      color,
      schedule: initialData ? initialData.schedule : [{ time, status: 'due-now' }],
      nextDose: initialData ? initialData.nextDose : `Today, ${nextDoseTime}`
    });
    onClose();
  };

  const handleTimeChange = (newTime: string) => {
    if (nextDoseTime === time) {
      setNextDoseTime(newTime);
    }
    setTime(newTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-on-surface">{mode === 'add' ? 'Add Medication' : 'Edit Medication'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Medication Name</label>
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Metformin"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Display Color</label>
              <div className="flex gap-2">
                {['#005da7', '#007b5e', '#d32f2f', '#7b1fa2', '#f57c00'].map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-primary scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Dosage</label>
              <input 
                required
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. 500mg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Form</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="pill">Pill</option>
                <option value="capsule">Capsule</option>
                <option value="liquid">Liquid</option>
                <option value="injection">Injection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Frequency</label>
              <select 
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option>1x Daily</option>
                <option>2x Daily</option>
                <option>3x Daily</option>
                <option>As Needed</option>
              </select>
            </div>
            {mode === 'add' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Schedule Time</label>
                <input 
                  type="time"
                  value={time}
                  onChange={e => handleTimeChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            )}
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">First/Next Dose</label>
              <input 
                type="time"
                value={nextDoseTime}
                onChange={e => setNextDoseTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60 italic">
                * Defaults to schedule time, but you can adjust it for the very first dose.
              </p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {mode === 'add' ? <Plus size={20} /> : <Check size={20} />}
            {mode === 'add' ? 'Save Medication' : 'Update Medication'}
          </button>
        </form>
      </div>
    </div>
  );
};
