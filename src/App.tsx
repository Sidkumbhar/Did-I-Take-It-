import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Pill, CalendarDays, BarChart3, Settings, Search, Bell, Plus, 
  CheckCircle2, Clock, AlertCircle, ShieldCheck, LogOut, Users, Mail, Activity, Mic, Stethoscope, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, AdminView, Medication, UserData, DoseLog } from './types';
import { api } from './services/api';
import { MedicationModal } from './components/AddMedicationModal';
import { AuthPage } from './components/AuthPage';
import { DashboardView } from './components/DashboardView';
import { MedicationsView } from './components/MedicationsView';
import { ScheduleView } from './components/ScheduleView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminMedicationsView } from './components/AdminMedicationsView';
import { AdminNotificationsView } from './components/AdminNotificationsView';
import { VoiceLogView } from './components/VoiceLogView';
import { ReportView } from './components/ReportView';

// --- Sidebar ---
const UserSidebar = ({ currentView, setView, user, onLogout }: { currentView: View, setView: (v: View) => void, user: UserData, onLogout: () => void }) => {
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications' as View, label: 'My Medications', icon: Pill },
    { id: 'schedule' as View, label: 'Schedule', icon: CalendarDays },
    { id: 'voice-log' as View, label: 'Dr. AI', icon: Stethoscope },
    { id: 'reports' as View, label: 'Doctor Reports', icon: FileText },
    { id: 'history' as View, label: 'History', icon: BarChart3 },
    { id: 'settings' as View, label: 'Settings', icon: Settings },
  ];
  return (
    <nav className="w-[240px] h-full bg-surface-container-low border-r border-outline-variant/15 flex flex-col p-6 z-10 shrink-0">
      <div className="flex items-center gap-3 py-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-semibold text-on-surface leading-tight">{user.name}</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">🔥 {user.streak} days streak</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer text-left ${
                isActive ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/30'
              }`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-4 border-t border-outline-variant/15">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/5 rounded-xl transition-all">
          <LogOut size={20} /><span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

const AdminSidebar = ({ currentView, setView, user, onLogout }: { currentView: AdminView, setView: (v: AdminView) => void, user: UserData, onLogout: () => void }) => {
  const menuItems = [
    { id: 'admin-dashboard' as AdminView, label: 'Dashboard', icon: Activity },
    { id: 'admin-users' as AdminView, label: 'Users', icon: Users },
    { id: 'admin-medications' as AdminView, label: 'All Medications', icon: Pill },
    { id: 'admin-notifications' as AdminView, label: 'Notifications', icon: Mail },
  ];
  return (
    <nav className="w-[240px] h-full bg-[#1a1025] border-r border-purple-500/10 flex flex-col p-6 z-10 shrink-0">
      <div className="flex items-center gap-3 py-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-admin flex items-center justify-center text-white font-bold text-lg shadow-lg">A</div>
        <div>
          <h2 className="text-base font-semibold text-white leading-tight">{user.name}</h2>
          <p className="text-xs text-purple-300/60 mt-0.5 font-bold uppercase tracking-widest">Admin Panel</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer text-left ${
                isActive ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-4 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={20} /><span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

const TopBar = ({ isAdmin }: { isAdmin?: boolean }) => (
  <header className={`h-16 w-full px-6 flex justify-between items-center z-40 ${isAdmin ? 'bg-[#1a1025]/80 backdrop-blur-xl border-b border-purple-500/10' : 'glass-effect'}`}>
    <div className={`flex items-center gap-2 text-lg font-bold ${isAdmin ? 'text-white' : 'text-on-surface'}`}>
      <Pill className={isAdmin ? 'text-purple-400 fill-purple-400' : 'text-primary fill-primary'} />
      <span className="tracking-tight">Did I Take It?</span>
      {isAdmin && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-2">Admin</span>}
    </div>
    <div className="flex items-center gap-3">
      <button className={`p-2 rounded-full relative transition-colors ${isAdmin ? 'hover:bg-white/5 text-white/40' : 'hover:bg-surface-container-highest/30 text-on-surface-variant'}`}>
        <Bell size={20} />
      </button>
    </div>
  </header>
);

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>('dashboard');
  const [adminView, setAdminView] = useState<AdminView>('admin-dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: React.ReactNode }>>([]);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getMe().then(res => { setUser(res.user); }).catch(() => { localStorage.removeItem('auth_token'); }).finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Fetch medications when user logs in
  useEffect(() => {
    if (user && user.role === 'user') {
      fetchMedications();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  // Frontend Dose Notification Scheduler
  useEffect(() => {
    if (!user || user.role !== 'user' || medications.length === 0) return;
    
    const checkDoses = () => {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${HH}:${mm}`;
      
      let doseDue = false;
      medications.forEach(med => {
        med.schedule.forEach(dose => {
          if (dose.time === currentTime && dose.status !== 'taken') {
            const msg = `⏰ Time to take ${med.name} (${med.dosage || '1 dose'})!`;
            addToast(msg);
            doseDue = true;
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Medication Reminder', { body: msg, icon: '/favicon.ico' });
            }
          }
        });
      });

      // Silent background fetch to keep dashboard statuses (due-now, missed) perfectly in sync
      api.getMedications().then(setMedications).catch(console.error);
    };

    const interval = setInterval(checkDoses, 60000);
    return () => clearInterval(interval);
  }, [medications, user]);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true); setAuthError(null);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
    } catch (err: any) { setAuthError(err.message); } finally { setAuthLoading(false); }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    setAuthLoading(true); setAuthError(null);
    try {
      const res = await api.register(name, email, password);
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
    } catch (err: any) { setAuthError(err.message); } finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null); setMedications([]); setView('dashboard'); setAdminView('admin-dashboard');
  };

  const fetchMedications = async () => {
    setIsLoading(true);
    try { const meds = await api.getMedications(); setMedications(meds); } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleAddMedication = async (med: Partial<Medication>) => {
    try { const newMed = await api.addMedication(med); setMedications(prev => [...prev, newMed]); addToast('Medication added successfully!'); } catch (err) { console.error(err); }
  };

  const handleUpdateMedication = async (med: Partial<Medication>) => {
    if (!editingMedication) return;
    try {
      const medId = editingMedication._id || editingMedication.id!;
      const updated = await api.updateMedication(medId, med);
      setMedications(prev => prev.map(m => (m._id === medId || m.id === medId) ? updated : m));
      addToast('Medication updated!');
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => { setModalMode('add'); setEditingMedication(null); setIsModalOpen(true); };
  const openEditModal = (med: Medication) => { setModalMode('edit'); setEditingMedication(med); setIsModalOpen(true); };

  const handleLogDose = async (medId: string, idx: number, status: string) => {
    try {
      const { med: updated, etherealUrl } = await api.logDose(medId, idx, status, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMedications(prev => prev.map(m => m._id === medId ? updated : m));
      addToast(status === 'taken' ? '✅ Dose logged!' : '⏭️ Dose skipped');
      if (etherealUrl) {
        setTimeout(() => {
          addToast(
            <div className="flex flex-col gap-1">
              <span>📧 Test Email Sent!</span>
              <a href={etherealUrl} target="_blank" rel="noreferrer" className="underline font-bold text-white hover:text-blue-200 transition-colors">Click here to view</a>
            </div>
          );
        }, 300);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateDoseTime = async (medId: string, idx: number, newTime: string) => {
    try {
      const updated = await api.updateDoseTime(medId, idx, newTime);
      setMedications(prev => prev.map(m => m._id === medId ? updated : m));
    } catch (err) { console.error(err); }
  };

  const addToast = (message: React.ReactNode) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // --- Auth Screen ---
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} error={authError} isLoading={authLoading} />;

  // --- Admin Panel ---
  if (user.role === 'admin') {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#0f0a1a] relative">
        <AdminSidebar currentView={adminView} setView={setAdminView} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <TopBar isAdmin />
          <main className="flex-1 overflow-y-auto px-10 bg-[#0f0a1a]">
            {adminView === 'admin-dashboard' && <AdminDashboardView />}
            {adminView === 'admin-users' && <AdminUsersView />}
            {adminView === 'admin-medications' && <AdminMedicationsView />}
            {adminView === 'admin-notifications' && <AdminNotificationsView />}
          </main>
        </div>
      </div>
    );
  }

  // --- User Panel ---
  const renderUserView = () => {
    if (isLoading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    switch (view) {
      case 'dashboard': return <DashboardView medications={medications} onAddClick={openAddModal} onLog={handleLogDose} user={user} />;
      case 'medications': return <MedicationsView medications={medications} onAddClick={openAddModal} onEditClick={openEditModal} />;
      case 'schedule': return <ScheduleView medications={medications} onLog={handleLogDose} onUpdateTime={handleUpdateDoseTime} />;
      case 'voice-log': return <VoiceLogView />;
      case 'reports': return <ReportView />;
      case 'history': return <HistoryView />;
      case 'settings': return <SettingsView user={user} onUpdateProfile={async (data) => { try { const res = await api.updateProfile(data); setUser(res.user); addToast('Settings saved!'); } catch(e) { console.error(e); } }} />;
      default: return <DashboardView medications={medications} onAddClick={openAddModal} onLog={handleLogDose} user={user} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      <UserSidebar currentView={view} setView={setView} user={user} onLogout={handleLogout} />
      {/* Toasts */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-primary text-on-primary p-4 rounded-2xl shadow-2xl pointer-events-auto border border-white/10">
              <div className="text-sm font-medium">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className={`flex-1 ${view === 'voice-log' ? 'overflow-hidden' : 'overflow-y-auto'} px-6 sm:px-10`}>
          <AnimatePresence mode="wait"><React.Fragment key={view}>{renderUserView()}</React.Fragment></AnimatePresence>
        </main>
        <MedicationModal isOpen={isModalOpen} mode={modalMode} initialData={editingMedication} onClose={() => setIsModalOpen(false)} onSave={modalMode === 'add' ? handleAddMedication : handleUpdateMedication} />
      </div>
    </div>
  );
}
