import { api } from './client';
export interface SpecialtyRecord { id: string; name_ar: string|null; name_en: string; name_he: string|null; description: string|null; active: boolean; }
export interface ServiceRecord extends SpecialtyRecord { duration_minutes: number; price: number; consultation_type: 'clinic'|'video'; }
export const servicesApi = {
  specialties: () => api<SpecialtyRecord[]>('/specialties'),
  list: () => api<ServiceRecord[]>('/services'),
};
