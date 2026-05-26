export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface ClinicSettings {
  id: number;
  brand_name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  working_hours_note: string | null;
  about_text: string | null;
}

export interface Service {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface DoctorService {
  service: Service;
  custom_price: number | null;
}

export interface DoctorSchedule {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface DoctorScheduleException {
  id: number;
  exception_date: string;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface Doctor {
  id: number;
  user_id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  title: string;
  rating: number;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  achievements: string | null;
  experience_years: number | null;
  commission_percent: number | null;
  fixed_payout: number | null;
  is_active: boolean;
  services: DoctorService[];
  schedules: DoctorSchedule[];
  schedule_exceptions: DoctorScheduleException[];
}

export type AppointmentStatus = "new" | "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentMethod = "online" | "offline";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  service_id: number;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  promo_code: string | null;
  discount_amount: number;
  final_amount: number;
  payment_id: number | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus | null;
  patient_name: string;
  doctor_name: string;
  service_name: string;
}

export interface AvailableSlot {
  starts_at: string;
  ends_at: string;
}

export interface Review {
  id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  rating: number;
  comment: string | null;
  moderation_status: string;
  patient_name: string;
  doctor_name: string;
  service_name: string;
  appointment_starts_at: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface PatientCard {
  id: number;
  patient_id: number;
  birth_date: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  general_notes: string | null;
}

export interface DentalVisit {
  id: number;
  patient_card_id: number;
  appointment_id: number | null;
  diagnosis: string | null;
  treatment_performed: string | null;
  prescriptions: string | null;
  next_visit_recommendation: string | null;
  doctor_notes: string | null;
  created_at: string;
}
