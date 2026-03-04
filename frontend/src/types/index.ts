export interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  role: 'master' | 'client';
  phone?: string;
}

export interface MasterProfile {
  id: number;
  userId: number;
  businessName?: string;
  description?: string;
  address?: string;
  phone?: string;
  workingHours: WorkingHours;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface Service {
  id: number;
  masterId: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  id: number;
  masterId: number;
  clientId: number;
  serviceId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  price?: number;
  durationMinutes?: number;
  color?: string;
  masterFirstName?: string;
  masterLastName?: string;
  businessName?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
