import React, { useState, useEffect } from 'react';
import { Bell, Volume2, Smartphone, Clock, ChevronRight, User, CheckCircle2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData } from '../types';

export const SettingsView = ({ user, onUpdateProfile }: { user: UserData, onUpdateProfile: (data: Partial<{ name: string; notificationsEnabled: boolean }>) => Promise<void> }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('timeFormat') || '12h');

  useEffect(() => { if (showSaved) { const t = setTimeout(() => setShowSaved(false), 2000); return () => clearTimeout(t); } }, [showSaved]);

  const handleSave = async (data: any) => { await onUpdateProfile(data); setShowSaved(true); };

  const SettingRow = ({ icon: Icon, title, description, children }: { icon: any, title: string, description: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary"><Icon size={20} /></div>
        <div><h4 className="font-bold text-on-surface">{title}</h4><p className="text-sm text-on-surface-variant font-medium">{description}</p></div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto w-full py-10 flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Settings</h1>
          <p className="text-on-surface-variant text-lg mt-2 font-medium">Customize your medication tracking experience.</p>
        </div>
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-widest border border-secondary/10">
              <CheckCircle2 size={14} />Auto-saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <section className="glass-effect rounded-3xl p-8 border border-outline-variant/10">
        <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-6 flex items-center gap-2"><User size={14} />Profile</h3>
        <div className="divide-y divide-outline-variant/10">
          <div className="flex items-center justify-between py-4">
            <div><p className="text-sm text-on-surface-variant">Name</p><p className="font-bold text-on-surface">{user.name}</p></div>
          </div>
          <div className="flex items-center justify-between py-4">
            <div><p className="text-sm text-on-surface-variant">Email</p><p className="font-bold text-on-surface">{user.email}</p></div>
          </div>
          <div className="flex items-center justify-between py-4">
            <div><p className="text-sm text-on-surface-variant">Role</p><p className="font-bold text-on-surface capitalize">{user.role}</p></div>
          </div>
        </div>
      </section>

      {/* Email Notifications */}
      <section className="glass-effect rounded-3xl p-8 border border-outline-variant/10">
        <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-6 flex items-center gap-2"><Mail size={14} />Email Notifications</h3>
        <div className="divide-y divide-outline-variant/10">
          <SettingRow icon={Bell} title="Email Reminders" description="Receive email reminders when a dose is due">
            <button onClick={() => handleSave({ notificationsEnabled: !user.notificationsEnabled })}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${user.notificationsEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${user.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>
          <SettingRow icon={Bell} title="Missed Dose Alerts" description="Get notified via email if you miss a scheduled dose">
            <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Automatic</span>
          </SettingRow>
        </div>
      </section>

      {/* General */}
      <section className="glass-effect rounded-3xl p-8 border border-outline-variant/10">
        <h3 className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-6 flex items-center gap-2"><Clock size={14} />General</h3>
        <div className="divide-y divide-outline-variant/10">
          <SettingRow icon={Clock} title="Time Format" description="Display times in 12-hour or 24-hour format">
            <div className="flex bg-surface-container-low rounded-lg p-1">
              <button onClick={() => { setTimeFormat('12h'); localStorage.setItem('timeFormat', '12h'); setShowSaved(true); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeFormat === '12h' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}>12h</button>
              <button onClick={() => { setTimeFormat('24h'); localStorage.setItem('timeFormat', '24h'); setShowSaved(true); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeFormat === '24h' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}>24h</button>
            </div>
          </SettingRow>
        </div>
      </section>
    </motion.div>
  );
};
