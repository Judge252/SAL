import {api,json} from './client';
export const adminApi = {
  list:<T>(kind:string)=>api<T[]>(`/admin/${kind}`),
  save:<T>(kind:string,data:unknown,id?:string)=>api<T>(`/admin/${kind}${id?`/${id}`:''}`,{method:id?'PATCH':'POST',body:json(data)}),
  approve:(id:string)=>api(`/admin/doctors/${id}/approve`,{method:'PATCH'}),
  remove:(kind:string,id:string)=>api(`/admin/${kind}/${id}`,{method:'DELETE'}),
  upload:(data:FormData,id?:string)=>api(`/admin/knowledge${id?`/${id}/replace`:''}`,{method:'POST',body:data}),
};
