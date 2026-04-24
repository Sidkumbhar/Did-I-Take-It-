export interface Medication {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  status: 'active' | 'paused' | 'as-needed';
  adherence: number;
  type: 'pill' | 'capsule' | 'liquid' | 'injection';
  color: string;
  schedule: Array<{
    time: string;
    status: 'taken' | 'missed' | 'upcoming' | 'due-now';
    loggedTime?: string;
  }>;
  createdAt?: string;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  streak: number;
  notificationsEnabled: boolean;
}

export interface DoseLog {
  _id: string;
  userId: string | { name: string; email: string };
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  status: 'taken' | 'missed';
  loggedAt: string;
}

export interface NotificationLog {
  _id: string;
  userId: string | { name: string; email: string };
  type: 'dose_reminder' | 'missed_alert' | 'welcome' | 'dose_taken';
  subject: string;
  status: 'sent' | 'failed';
  sentAt: string;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMedications: number;
  totalDoseLogs: number;
  totalNotifications: number;
  avgAdherence: number;
  todayLogs: number;
  todayTaken: number;
  todayMissed: number;
  emailsSent: number;
  emailsFailed: number;
}

export interface AdminUser extends UserData {
  medicationCount: number;
  avgAdherence: number;
  doseLogCount: number;
  createdAt: string;
}

export interface SymptomLog {
  _id: string;
  userId: string;
  rawText: string;
  symptoms: Array<{ name: string; severity: string }>;
  timing: string | null;
  triggerMedication: string | null;
  medicationId: string | { name: string; dosage: string } | null;
  loggedAt: string;
  createdAt?: string;
}

export type View = 'dashboard' | 'medications' | 'schedule' | 'history' | 'settings' | 'voice-log' | 'reports';
export type AdminView = 'admin-dashboard' | 'admin-users' | 'admin-medications' | 'admin-notifications' | 'admin-settings';
