"use client";
import Link from 'next/link';
import type {Doctor} from '@/lib/types';
import {useClinic} from './provider';
import {Avatar,Arrow} from './ui';
import {languageNames} from '@/lib/data';
export function Profile({doctor:d}:{doctor:Doctor}){
 const {t,locale,specialties}=useClinic();const row=d.record;
 return <div className="container page"><Link className="back-link" href="/doctors"><Arrow/>{t('جميع الأطباء','All doctors','כל הרופאים')}</Link><section className="profile-hero"><Avatar doctor={d} large/><div><h1>{d.name[locale]}</h1><p>{specialties[d.specialty]?.[locale]||row.specialties.name_en}</p><div className="doctor-meta"><span>{d.city[locale]}</span><span>{d.languages.map(l=>languageNames[l]||l).join(' · ')}</span></div></div></section>
 <div className="profile-layout"><div><section className="profile-section"><h2>{t('عن الطبيب','About the clinician','על הרופא')}</h2><p>{row.bio}</p><div className="profile-facts"><b>{d.experience} {t('سنوات خبرة','years of experience','שנות ניסיון')}</b></div></section>
 <section className="profile-section"><h2>{t('الخدمات والاستشارات','Services and consultations','שירותים וייעוצים')}</h2><div className="visit-types">{row.services.map(s=><Link href={`/booking/${d.id}?mode=${s.consultation_type}`} key={s.id}><div><h3>{s[`name_${locale}`]||s.name_en}</h3><p>{s.duration_minutes} {t('دقيقة','minutes','דקות')} · {s.price} ILS · {s.consultation_type==='video'?t('بالفيديو','Video','וידאו'):t('في العيادة','In clinic','במרפאה')}</p></div><Arrow/></Link>)}</div></section>
 <section className="profile-section"><h2>{t('مواقع العيادة','Clinic locations','מיקומי מרפאה')}</h2>{row.doctor_locations.map(l=><div className="location-panel" key={l.id}><div><h3>{l.clinic_name}</h3><p>{l.address} · {l.city}</p></div></div>)}</section></div>
 <aside className="booking-aside"><h2>{t('اختر موعد زيارتك','Choose your appointment','בחרו תור')}</h2><p>{row.availability?.length?t('الأوقات المتاحة بتوقيت القدس','Available times use Jerusalem time','הזמנים לפי שעון ירושלים'):t('لا توجد مواعيد متاحة حاليًا','No appointments available right now','אין תורים זמינים כרגע')}</p>{row.availability?.slice(0,3).map(s=><p key={s.id}>{s.date} · {s.start_time.slice(0,5)}</p>)}<Link className="button full" href={`/booking/${d.id}`}>{t('اختيار الخدمة والموعد','Choose service and time','בחירת שירות ומועד')}<Arrow/></Link></aside></div></div>;
}
