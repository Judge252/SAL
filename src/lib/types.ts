export type Locale = "ar" | "en" | "he";
export type Localized = Record<Locale, string>;
export type Specialty =
  | "family"
  | "cardiology"
  | "dermatology"
  | "orthopedics"
  | "neurology"
  | "pediatrics"
  | "gynecology"
  | "psychiatry"
  | "ent"
  | "physiotherapy";
export type ConsultationType = "clinic" | "video";
export interface Doctor {
  id: string;
  name: Localized;
  initials: string;
  specialty: Specialty;
  city: Localized;
  cityId: string;
  languages: Locale[];
  experience: number;
  portrait?: string;
  consultations: ConsultationType[];
  nextDay: number;
  color: string;
}
export interface Appointment {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  consultation: ConsultationType;
  status: "upcoming" | "cancelled";
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
export interface Intake {
  concern: string;
  duration: string;
  severity: string;
  age: string;
  city: string;
}
