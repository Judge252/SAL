"use client";
import {useState} from 'react';
import Link from 'next/link';
import type {Doctor} from '@/lib/types';
import {doctorsApi} from '@/lib/api/doctors';
import {appointmentsApi} from '@/lib/api/appointments';
import {useClinic} from './provider';
import {PageHeading,Avatar} from './ui';
import {AuthGuard,ErrorNotice} from './auth';
export function Booking(props:{doctor:Doctor;initialMode?:string}){return <AuthGuard roles={['patient']}><BookingForm {...props}/></AuthGuard>;}
function BookingForm({doctor,initialMode}:{doctor:Doctor;initialMode?:string}){
 const {t,locale}=useClinic();const services=doctor.record.services;
 const [service,setService]=useState(services.find(s=>s.consultation_type===initialMode)?.id||services[0]?.id||'');
 const [slots,setSlots]=useState(doctor.record.availability||[]),[slot,setSlot]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[confirmation,setConfirmation]=useState('');
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const selected=services.find(s=>s.id===service);const available=slots.filter(s=>selected&&((Number(s.end_time.slice(0,2))*60+Number(s.end_time.slice(3,5)))-(Number(s.start_time.slice(0,2))*60+Number(s.start_time.slice(3,5))))>=selected.duration_minutes);
 if(confirmation)return <div className="container page auth-page"><PageHeading title={t('تم إرسال طلب الموعد','Appointment requested','בקשת התור נשלחה')} description={t('حُفظ الطلب وهو بانتظار تأكيد الطبيب. لم يتم تحصيل أي مبلغ.','Your request is saved and pending the clinician’s confirmation. No payment has been collected.','הבקשה נשמרה וממתינה לאישור הרופא. לא נגבה תשלום.')}/><p>{confirmation}</p><Link className="button" href="/dashboard">{t('عرض مواعيدي','View my appointments','התורים שלי')}</Link></div>;
 return <div className="container page"><PageHeading title={t('اختر موعد زيارتك','Choose your appointment','בחרו את התור')}/><div className="profile-layout"><form className="live-form" onSubmit={async e=>{e.preventDefault();if(!slot)return;setBusy(true);setError('');const data=new FormData(e.currentTarget);try{const result=await appointmentsApi.book({doctor_id:doctor.id,service_id:service,slot_id:slot,request_id:requestId,notes:String(data.get('notes')||'')});setConfirmation(result.id);}catch(e){setError((e as Error).message);try{setSlots(await doctorsApi.slots(doctor.id));}catch{}}finally{setBusy(false);}}}>
 <label>{t('الخدمة','Service','שירות')}<select value={service} onChange={e=>{setService(e.target.value);setSlot('');setRequestId(crypto.randomUUID());}} required>{services.map(s=><option key={s.id} value={s.id}>{s[`name_${locale}`]||s.name_en} · {s.price} ILS</option>)}</select></label>
 <fieldset><legend>{t('الموعد — بتوقيت القدس','Time — Jerusalem timezone','מועד — שעון ירושלים')}</legend><div className="slot-picker">{available.map(s=><label key={s.id}><input type="radio" name="slot" value={s.id} checked={slot===s.id} required onChange={()=>{setSlot(s.id);setRequestId(crypto.randomUUID());}}/>{s.date} · {s.start_time.slice(0,5)}</label>)}</div>{!available.length&&<p>{t('لا توجد أوقات متاحة لهذه الخدمة.','No times are available for this service.','אין מועדים זמינים לשירות זה.')}</p>}</fieldset>
 <label>{t('ملاحظات للطبيب — اختيارية','Notes for your clinician — optional','הערות לרופא — רשות')}<textarea name="notes" maxLength={2000}/></label>
 {selected&&<p>{selected.price} ILS · {selected.duration_minutes} {t('دقيقة','minutes','דקות')} · {selected.consultation_type==='video'?t('بالفيديو','Video','וידאו'):t('في العيادة','In clinic','במרפאה')}</p>}
 <p>{t('سيظل الطلب قيد الانتظار حتى يؤكده الطبيب. الدفع الإلكتروني غير مفعّل.','Your request stays pending until the clinician confirms it. Online payment is not enabled.','הבקשה ממתינה לאישור הרופא. תשלום מקוון אינו פעיל.')}</p>
 <ErrorNotice error={error}/><button className="button" disabled={busy||!slot}>{busy?t('جارٍ الحجز…','Booking…','שומרים…'):t('تأكيد طلب الموعد','Confirm appointment request','אישור בקשת תור')}</button></form><aside className="booking-aside"><Avatar doctor={doctor}/><h2>{doctor.name[locale]}</h2><p>{doctor.city[locale]}</p><Link href={`/doctors/${doctor.id}`}>{t('عرض الملف','View profile','לפרופיל')}</Link></aside></div></div>;
}
