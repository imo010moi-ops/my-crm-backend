import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  telegramAuth: (initData: string) => 
    api.post('/auth/telegram-auth', { initData }),
  
  getMe: () => 
    api.get('/auth/me'),
  
  updateProfile: (data: Partial<{ phone: string; businessName: string; description: string; address: string; workingHours: any }>) => 
    api.put('/auth/profile', data),
  
  registerMaster: (data: { businessName: string; description: string; address: string; phone: string; workingHours: any }) => 
    api.post('/auth/register-master', data)
};

// Services API
export const servicesApi = {
  getMasterServices: (masterId: number) => 
    api.get(`/master/${masterId}/services`),
  
  getMyServices: () => 
    api.get('/my-services'),
  
  createService: (data: { name: string; description?: string; price: number; durationMinutes: number; color?: string }) => 
    api.post('/services', data),
  
  updateService: (id: number, data: Partial<Service>) => 
    api.put(`/services/${id}`, data),
  
  deleteService: (id: number) => 
    api.delete(`/services/${id}`),
  
  getStats: () => 
    api.get('/services/stats')
};

// Appointments API
export const appointmentsApi = {
  getAvailableSlots: (masterId: number, date: string) => 
    api.get(`/masters/${masterId}/slots?date=${date}`),
  
  createAppointment: (data: { masterId: number; serviceId: number; appointmentDate: string; startTime: string; notes?: string; clientName?: string; clientPhone?: string }) => 
    api.post('/appointments', data),
  
  getMyAppointments: () => 
    api.get('/my-appointments'),
  
  getTodayAppointments: () => 
    api.get('/appointments/today'),
  
  getWeekAppointments: () => 
    api.get('/appointments/week'),
  
  getAppointment: (id: number) => 
    api.get(`/appointments/${id}`),
  
  updateStatus: (id: number, status: string) => 
    api.patch(`/appointments/${id}/status`, { status }),
  
  cancelAppointment: (id: number, reason?: string) => 
    api.post(`/appointments/${id}/cancel`, { reason })
};

// Masters API
export const mastersApi = {
  getAll: () => 
    api.get('/masters')
};

export default api;
