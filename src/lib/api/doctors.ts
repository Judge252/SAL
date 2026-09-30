import { api } from './client';
import type { SpecialtyRecord, ServiceRecord } from './services';
import type { Doctor } from '../types';
export interface Slot { id:string; doctor_id:string; date:string; start_time:string; end_time:string; is_booked:boolean; }
export interface DoctorRecord {
  id:string; full_name:string; bio:string|null; experience_years:number|null;
  languages:string[]|null; consultation_fee:number|null; profile_image:string|null;
  specialty_id:string; status:string; specialties:SpecialtyRecord;
  doctor_locations:{id:string;clinic_name:string;address:string;city:string}[];
  services:ServiceRecord[]; availability?:Slot[];
}
export const doctorsApi = {
  list: (params?: URLSearchParams) => api<DoctorRecord[]>(`/doctors${params?.size ? `?${params}`:''}`),
  get: (id:string) => api<DoctorRecord>(`/doctors/${id}`),
  slots: (id:string) => api<Slot[]>(`/doctors/${id}/availability`),
};
export function toDoctor(row:DoctorRecord):Doctor {
  const city=row.doctor_locations[0]?.city || '';
  return {id:row.id,name:{ar:row.full_name,en:row.full_name,he:row.full_name},initials:row.full_name.split(' ').slice(0,2).map(s=>s[0]).join(''),
    specialty:row.specialty_id,city:{ar:city,en:city,he:city},cityId:city,
    languages:row.languages||[],experience:row.experience_years||0,
    consultations:[...new Set(row.services.map(s=>s.consultation_type).filter(Boolean))],
    nextDay:0,color:'blue',record:row};
}
