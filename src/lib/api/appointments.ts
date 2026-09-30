import { api,json } from './client';
import type { Slot } from './doctors';
export interface AppointmentRecord {
  id:string; patient_id:string; doctor_id:string; service_id:string; slot_id:string;
  status:'pending'|'confirmed'|'completed'|'cancelled'; payment_status:string;
  amount:number; currency:string; consultation_type:'clinic'|'video'; notes:string;
  doctors:{id:string;full_name:string}; services:{id:string;name_ar:string;name_en:string;name_he:string};
  availability_slots:Pick<Slot,'date'|'start_time'|'end_time'>;
}
export const appointmentsApi = {
  list: (role:'patient'|'doctor'|'admin'='patient')=>api<AppointmentRecord[]>(`/${role}/appointments`),
  book:(data:{doctor_id:string;service_id:string;slot_id:string;request_id:string;notes:string})=>api<AppointmentRecord>('/appointments',{method:'POST',body:json(data)}),
  update:(id:string,status:string)=>api<AppointmentRecord>(`/appointments/${id}`,{method:'PATCH',body:json({status})}),
};
