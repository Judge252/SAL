import {DoctorLoader} from '@/components/doctor-loader';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{mode?:string}>}){const {id}=await params;const {mode}=await searchParams;return <DoctorLoader id={id} booking={true} mode={mode}/>;}
