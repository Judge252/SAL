"use client";
import {useState,useEffect,useCallback} from 'react';
import Link from 'next/link';
import {useClinic} from './provider';
import {PageHeading} from './ui';
import {AuthGuard,ErrorNotice} from './auth';
import {auth} from '@/lib/api/auth';
import {appointmentsApi,type AppointmentRecord} from '@/lib/api/appointments';
import {salApi,type Conversation} from '@/lib/api/sal';
import {api} from '@/lib/api/client';
export function Dashboard(){return <AuthGuard><PatientWorkspace/></AuthGuard>;}
export function AppointmentList({role='patient'}:{role?:'patient'|'doctor'|'admin'}){
 const {t,locale}=useClinic();const [rows,setRows]=useState<AppointmentRecord[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 const load=useCallback(async()=>{setLoading(true);try{setRows(await appointmentsApi.list(role));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[role]);
 useEffect(()=>{void Promise.resolve().then(load);},[load]);
 async function update(id:string,status:string){setBusy(id);try{await appointmentsApi.update(id,status);await load();}catch(e){setError((e as Error).message);}finally{setBusy('');}}
 return <section><ErrorNotice error={error}/>{loading&&<p role="status">{t('جارٍ التحميل…','Loading…','טוענים…')}</p>}{!loading&&!rows.length&&<div className="empty-state"><h3>{t('لا توجد مواعيد بعد','No appointments yet','אין תורים עדיין')}</h3><Link href="/doctors">{t('ابحث عن طبيب','Find a doctor','מצאו רופא')}</Link></div>}
 {rows.map(a=><article className="live-row" key={a.id}><div><h3>{a.doctors?.full_name}</h3><p>{a.services?.[`name_${locale}`]||a.services?.name_en}</p><p>{a.availability_slots?.date} · {a.availability_slots?.start_time.slice(0,5)} — {t('بتوقيت القدس','Jerusalem time','שעון ירושלים')}</p><p>{t('الحالة','Status','מצב')}: {({pending:t('قيد الانتظار','Pending','ממתין'),confirmed:t('مؤكد','Confirmed','מאושר'),completed:t('مكتمل','Completed','הושלם'),cancelled:t('ملغي','Cancelled','בוטל')})[a.status]}</p><p>{a.amount} {a.currency} · {t('الدفع','Payment','תשלום')}: {a.payment_status}</p>{role!=='patient'&&a.notes&&<p>{a.notes}</p>}</div><div className="row-actions">
 {role!=='patient'&&a.status==='pending'&&<button className="button small" disabled={busy===a.id} onClick={()=>update(a.id,'confirmed')}>{t('تأكيد','Confirm','אישור')}</button>}
 {role!=='patient'&&a.status==='confirmed'&&<button className="button small" disabled={busy===a.id} onClick={()=>update(a.id,'completed')}>{t('إنهاء الزيارة','Complete visit','סיום ביקור')}</button>}
 {['pending','confirmed'].includes(a.status)&&<button className="button outline small" disabled={busy===a.id} onClick={()=>{if(window.confirm(t('إلغاء هذا الموعد؟','Cancel this appointment?','לבטל את התור?')))void update(a.id,'cancelled');}}>{t('إلغاء الموعد','Cancel appointment','ביטול תור')}</button>}</div></article>)}</section>;
}
function PatientWorkspace(){
 const {user,t,refreshUser}=useClinic();const [tab,setTab]=useState('appointments'),[error,setError]=useState(''),[notice,setNotice]=useState('');const [conversations,setConversations]=useState<Conversation[]>([]);
 useEffect(()=>{if(user?.role==='patient')salApi.conversations().then(setConversations).catch(e=>setError(e.message));},[user?.id,user?.role]);
 if(!user)return null;
 return <div className="container page"><PageHeading title={user.full_name||t('حسابي','My account','החשבון שלי')} description={user.email}><button className="button outline" onClick={async()=>{try{await auth.logout();await refreshUser();}catch(e){setError((e as Error).message);}}}>{t('تسجيل الخروج','Sign out','התנתקות')}</button></PageHeading>
 {user.role==='doctor'&&<Link className="button" href="/doctor-dashboard">{t('مساحة الطبيب','Doctor workspace','מרחב הרופא')}</Link>}{['admin','super_admin'].includes(user.role)&&<Link className="button" href="/admin/doctors">{t('إدارة المنصة','Platform administration','ניהול הפלטפורמה')}</Link>}
 <div className="tabs">{[['appointments',t('مواعيدي','Appointments','תורים')],['profile',t('الملف الشخصي','Profile','פרופיל')],...(user.role==='patient'?[['history',t('محادثات SAL','SAL history','שיחות SAL')],['documents',t('مستنداتي','My documents','המסמכים שלי')]]:[])].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div><ErrorNotice error={error}/>{notice&&<p role="status">{notice}</p>}
 {tab==='appointments'&&(user.role==='patient'?<AppointmentList/>:<p>{t('استخدم مساحة عملك لإدارة المواعيد.','Use your workspace to manage appointments.','השתמשו במרחב העבודה לניהול תורים.')}</p>)}
 {tab==='profile'&&<form className="live-form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await auth.update({full_name:String(f.get('full_name')),phone:String(f.get('phone'))||null,preferred_language:user.preferred_language});await refreshUser();setNotice(t('تم الحفظ','Saved','נשמר'));}catch(e){setError((e as Error).message);}}}><label>{t('الاسم','Name','שם')}<input name="full_name" defaultValue={user.full_name} required minLength={2}/></label><label>{t('الهاتف','Phone','טלפון')}<input name="phone" type="tel" defaultValue={user.phone||''}/></label><button className="button">{t('حفظ','Save','שמירה')}</button></form>}
 {tab==='history'&&<div>{!conversations.length&&<p>{t('لا توجد محادثات بعد','No conversations yet','אין שיחות עדיין')}</p>}{conversations.map(c=><Link className="live-row" key={c.id} href={`/sal?conversation=${c.id}`}>{new Date(c.created_at).toLocaleString()} → SAL</Link>)}</div>}
 {tab==='documents'&&<FileManager bucket="patient-files"/>}</div>;
}
interface StoredFile{name:string;id:string;created_at:string;metadata?:{size:number};}
export function FileManager({bucket}:{bucket:'patient-files'|'doctor-documents'|'avatars'}){
 const {t,user}=useClinic();const [files,setFiles]=useState<StoredFile[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(()=>api<StoredFile[]>(`/files/${bucket}`).then(setFiles).catch(e=>setError(e.message)),[bucket]);useEffect(()=>{void load();},[load]);
 return <section><ErrorNotice error={error}/><form className="live-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');try{await api(`/files/${bucket}`,{method:'POST',body:new FormData(form)});form.reset();await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><label>{t('رفع ملف خاص — حتى 8 ميجابايت','Upload a private file — up to 8 MB','העלאת קובץ פרטי — עד 8 MB')}<input name="file" type="file" accept={bucket==='avatars'?'.png,.jpg,.jpeg':'.pdf,.docx,.txt'} required/></label><button className="button" disabled={busy}>{busy?t('جارٍ الرفع…','Uploading…','מעלים…'):t('رفع الملف','Upload file','העלאת קובץ')}</button></form>{files.map(f=><div className="live-row" key={f.id}><span>{f.name}</span><button className="button outline small" onClick={async()=>{try{const r=await api<{signedURL:string}>(`/files/${bucket}/download?path=${encodeURIComponent(user!.id+'/'+f.name)}`);window.open(r.signedURL,'_blank','noopener,noreferrer');}catch(e){setError((e as Error).message);}}}>{t('تنزيل','Download','הורדה')}</button></div>)}</section>;
}
