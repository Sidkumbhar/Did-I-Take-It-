import { Medication, UserData, DoseLog, NotificationLog, AdminStats, AdminUser, SymptomLog } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function handleResponse(res: Response) {
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    throw new Error(`Request failed (${res.status})`);
  }
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

export const api = {
  // --- Auth ---
  async register(name: string, email: string, password: string): Promise<{ token: string; user: UserData }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserData }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: UserData }> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async updateProfile(data: Partial<{ name: string; notificationsEnabled: boolean }>): Promise<{ user: UserData }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async setupEnv(data: { emailUser?: string; emailPass?: string; mongodbUri?: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/setup-env`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- Medications ---
  async getMedications(): Promise<Medication[]> {
    const res = await fetch(`${API_BASE}/medications`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async addMedication(med: Partial<Medication>): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(med),
    });
    return handleResponse(res);
  },

  async updateMedication(medId: string, med: Partial<Medication>): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications/${medId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(med),
    });
    return handleResponse(res);
  },

  async deleteMedication(medId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/medications/${medId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async logDose(medId: string, scheduleIndex: number, status: string, loggedTime: string): Promise<{ med: Medication, etherealUrl?: string }> {
    const res = await fetch(`${API_BASE}/medications/${medId}/log`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ scheduleIndex, status, loggedTime }),
    });
    return handleResponse(res);
  },

  async updateDoseTime(medId: string, scheduleIndex: number, newTime: string): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications/${medId}/schedule/${scheduleIndex}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ time: newTime }),
    });
    return handleResponse(res);
  },

  async getDoseHistory(): Promise<DoseLog[]> {
    const res = await fetch(`${API_BASE}/medications/history/logs`, { headers: authHeaders() });
    return handleResponse(res);
  },

  // --- Admin ---
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async getAdminMedications(): Promise<(Medication & { userId: { name: string; email: string } })[]> {
    const res = await fetch(`${API_BASE}/admin/medications`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async getAdminNotifications(): Promise<NotificationLog[]> {
    const res = await fetch(`${API_BASE}/admin/notifications`, { headers: authHeaders() });
    return handleResponse(res);
  },

  // --- AI Doctor Chat ---
  async chatWithDoctor(message: string, history: Array<{ role: string; text: string }>): Promise<{ response: string }> {
    const res = await fetch(`${API_BASE}/voice-log/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message, history }),
    });
    return handleResponse(res);
  },

  async chatWithDoctorAudio(audio: string, mimeType: string, history: Array<{ role: string; text: string }>): Promise<{ response: string; transcript: string }> {
    const res = await fetch(`${API_BASE}/voice-log/audio`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ audio, mimeType, history }),
    });
    return handleResponse(res);
  },

  async getSymptomLogs(): Promise<SymptomLog[]> {
    const res = await fetch(`${API_BASE}/voice-log`, { headers: authHeaders() });
    return handleResponse(res);
  },

  // --- Reports ---
  async getReportData(days: number | 'all' = 30): Promise<{ summary: string; chartData: any[] }> {
    const res = await fetch(`${API_BASE}/reports/data?days=${days}`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async emailReportPdf(pdfBase64: string): Promise<{ success: boolean; etherealUrl?: string }> {
    const res = await fetch(`${API_BASE}/reports/email`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ pdfBase64 }),
    });
    return handleResponse(res);
  },
};
