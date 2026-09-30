"use client";
import {useEffect,useState} from 'react';
import {doctorsApi,toDoctor} from '@/lib/api/doctors';
import type {Doctor} from '@/lib/types';
import {Profile} from './profile';
import {Booking} from './booking';
import {ErrorNotice} from './auth';
import {useClinic} from './provider';
export function DoctorLoader({id,booking=false,mode}:{id:string;booking?:boolean;mode?:string}){
 const [doctor,setDoctor]=useState<Doctor|null>(null),[error,setError]=useState('');const {t}=useClinic();
 useEffect(()=>{let active=true;doctorsApi.get(id).then(d=>{if(active)setDoctor(toDoctor(d));}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 if(error)return <div className="container page"><ErrorNotice error={error}/></div>;
 if(!doctor)return <div className="container page" role="status">{t('جارٍ تحميل الملف…','Loading profile…','טוענים פרופיל…')}</div>;
 return booking?<Booking doctor={doctor} initialMode={mode}/>:<Profile doctor={doctor}/>;
}
