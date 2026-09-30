-- Additive changes to the existing Clinic schema. No tables are recreated.
begin;
alter table public.services add column if not exists consultation_type text not null default 'clinic'
  check (consultation_type in ('clinic','video'));
alter table public.appointments add column if not exists request_id uuid;
alter table public.appointments add column if not exists amount numeric;
alter table public.appointments add column if not exists currency text not null default 'ILS';
alter table public.appointments add column if not exists consultation_type text;
alter table public.knowledge_documents add column if not exists active boolean not null default true;
alter table public.knowledge_documents add column if not exists language text not null default 'ar';
alter table public.knowledge_documents add column if not exists document_type text not null default 'general';
alter table public.knowledge_documents add column if not exists embedding_model text;
create unique index if not exists clinic_booking_request on public.appointments(patient_id,request_id);
create unique index if not exists clinic_reserved_slot on public.appointments(slot_id) where status <> 'cancelled';
create unique index if not exists clinic_doctor_profile on public.doctors(profile_id) where profile_id is not null;
create unique index if not exists clinic_doctor_service on public.doctor_services(doctor_id,service_id);
create index if not exists clinic_doctor_slot_date on public.availability_slots(doctor_id,date,start_time);
create index if not exists clinic_patient_appointments on public.appointments(patient_id,created_at desc);
create index if not exists clinic_messages_conversation on public.sal_messages(conversation_id,created_at);
create index if not exists clinic_chunks_document on public.knowledge_chunks(document_id);

create or replace function public.clinic_save_doctor(p_actor uuid,p_id uuid,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.doctors; v_id uuid := coalesce(p_id,gen_random_uuid());
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','super_admin')) then raise insufficient_privilege; end if;
 if p_data->>'profile_id' is not null and not exists(select 1 from public.profiles where id=(p_data->>'profile_id')::uuid and role='doctor') then raise exception 'Doctor account required'; end if;
 if not exists(select 1 from public.specialties where id=(p_data->>'specialty_id')::uuid and active) then raise exception 'Specialty unavailable'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_data->'service_ids') x where not exists(select 1 from public.services where id=x::uuid and active)) then raise exception 'Service unavailable'; end if;
 if p_id is null then
  insert into public.doctors(id,profile_id,specialty_id,full_name,bio,languages,experience_years,consultation_fee)
  values(v_id,(p_data->>'profile_id')::uuid,(p_data->>'specialty_id')::uuid,p_data->>'full_name',p_data->>'bio',array(select jsonb_array_elements_text(p_data->'languages')),(p_data->>'experience_years')::int,(p_data->>'consultation_fee')::numeric);
 else
  update public.doctors set profile_id=(p_data->>'profile_id')::uuid,specialty_id=(p_data->>'specialty_id')::uuid,full_name=p_data->>'full_name',bio=p_data->>'bio',languages=array(select jsonb_array_elements_text(p_data->'languages')),experience_years=(p_data->>'experience_years')::int,consultation_fee=(p_data->>'consultation_fee')::numeric,updated_at=now() where id=v_id;
  if not found then raise exception 'Doctor not found'; end if;
 end if;
 delete from public.doctor_services where doctor_id=v_id;
 insert into public.doctor_services(doctor_id,service_id) select v_id,value::uuid from jsonb_array_elements_text(p_data->'service_ids');
 delete from public.doctor_locations where doctor_id=v_id;
 insert into public.doctor_locations(doctor_id,clinic_name,address,city) values(v_id,p_data->'location'->>'clinic_name',p_data->'location'->>'address',p_data->'location'->>'city');
 insert into public.audit_logs(user_id,action,table_name,record_id) values(p_actor,'save','doctors',v_id);
 select * into result from public.doctors where id=v_id;
 return to_jsonb(result);
end $$;

create or replace function public.clinic_add_slot(p_actor uuid,p_doctor uuid,p_date date,p_start time,p_end time)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.availability_slots;
begin
 perform 1 from public.doctors where id=p_doctor and profile_id=p_actor for update;
 if not found then raise insufficient_privilege; end if;
 if p_end<=p_start or (p_date+p_start) at time zone 'Asia/Jerusalem' <= now() then raise exception 'Invalid slot'; end if;
 if exists(select 1 from public.availability_slots where doctor_id=p_doctor and date=p_date and start_time<p_end and end_time>p_start) then raise exception 'Overlapping slot'; end if;
 insert into public.availability_slots(doctor_id,date,start_time,end_time) values(p_doctor,p_date,p_start,p_end) returning * into result;
 return to_jsonb(result);
end $$;

create or replace function public.clinic_remove_slot(p_actor uuid,p_slot uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_doctor uuid; s public.availability_slots;
begin
 select doctor_id into v_doctor from public.availability_slots where id=p_slot;
 perform 1 from public.doctors where id=v_doctor and profile_id=p_actor for update;
 if not found then raise insufficient_privilege; end if;
 select * into s from public.availability_slots where id=p_slot for update;
 if s.is_booked or exists(select 1 from public.appointments where slot_id=p_slot) then raise exception 'Slot has booking history'; end if;
 delete from public.availability_slots where id=p_slot;
 return jsonb_build_object('deleted',true);
end $$;

create or replace function public.clinic_book_appointment(p_patient uuid,p_doctor uuid,p_service uuid,p_slot uuid,p_request uuid,p_notes text default '')
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare s public.availability_slots; v_service public.services; result public.appointments;
begin
 if not exists(select 1 from public.profiles where id=p_patient and role='patient') then raise insufficient_privilege; end if;
 perform 1 from public.doctors d join public.specialties sp on sp.id=d.specialty_id where d.id=p_doctor and d.status='approved' and sp.active for update of d;
 if not found then raise exception 'Doctor unavailable'; end if;
 select * into result from public.appointments where patient_id=p_patient and request_id=p_request;
 if found then
  if result.doctor_id<>p_doctor or result.slot_id<>p_slot or result.service_id<>p_service then raise exception 'Request key conflict'; end if;
  return to_jsonb(result);
 end if;
 select * into s from public.availability_slots where id=p_slot and doctor_id=p_doctor for update;
 if not found or s.is_booked or (s.date+s.start_time) at time zone 'Asia/Jerusalem' <= now() then raise exception 'Slot unavailable'; end if;
 select sv.* into v_service from public.services sv join public.doctor_services ds on ds.service_id=sv.id where sv.id=p_service and ds.doctor_id=p_doctor and sv.active;
 if not found or v_service.duration_minutes is null or v_service.price is null or (s.end_time-s.start_time) < make_interval(mins=>v_service.duration_minutes) then raise exception 'Service unavailable for slot'; end if;
 if exists(select 1 from public.appointments a join public.availability_slots other on other.id=a.slot_id where a.status<>'cancelled' and a.doctor_id=p_doctor and other.date=s.date and other.start_time<s.end_time and other.end_time>s.start_time) then raise exception 'Overlapping appointment'; end if;
 insert into public.appointments(patient_id,doctor_id,service_id,slot_id,request_id,notes,payment_status,amount,currency,consultation_type)
 values(p_patient,p_doctor,p_service,p_slot,p_request,p_notes,'pending',v_service.price,'ILS',v_service.consultation_type) returning * into result;
 update public.availability_slots set is_booked=true where id=p_slot;
 return to_jsonb(result);
end $$;

create or replace function public.clinic_appointment_status(p_actor uuid,p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.appointments; v_role text; v_doctor uuid;
begin
 select role::text into v_role from public.profiles where id=p_actor;
 select doctor_id into v_doctor from public.appointments where id=p_id;
 perform 1 from public.doctors where id=v_doctor for update;
 select * into result from public.appointments where id=p_id for update;
 if not found then raise exception 'Appointment not found'; end if;
 if v_role in ('admin','super_admin') then null;
 elsif v_role='patient' and result.patient_id=p_actor and p_status='cancelled' then null;
 elsif v_role='doctor' and exists(select 1 from public.doctors where id=result.doctor_id and profile_id=p_actor) then null;
 else raise insufficient_privilege; end if;
 if result.status::text=p_status then return to_jsonb(result); end if;
 if not ((result.status='pending' and p_status in ('confirmed','cancelled')) or (result.status='confirmed' and p_status in ('completed','cancelled'))) then raise exception 'Invalid transition'; end if;
 if p_status='completed' and exists(select 1 from public.availability_slots where id=result.slot_id and (date+end_time) at time zone 'Asia/Jerusalem'>now()) then raise exception 'Visit has not ended'; end if;
 update public.appointments set status=p_status::public.appointment_status,updated_at=now() where id=p_id returning * into result;
 if p_status='cancelled' then update public.availability_slots set is_booked=false where id=result.slot_id; end if;
 insert into public.audit_logs(user_id,action,table_name,record_id) values(p_actor,p_status,'appointments',p_id);
 return to_jsonb(result);
end $$;

create or replace function public.clinic_create_payment(p_actor uuid,p_appointment uuid,p_provider text,p_transaction text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.payments; a public.appointments;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='patient') then raise insufficient_privilege; end if;
 select * into a from public.appointments where id=p_appointment and patient_id=p_actor for update;
 if not found then raise exception 'Appointment not found'; end if;
 if a.status='cancelled' then raise exception 'Appointment cancelled'; end if;
 if a.payment_status='paid' then raise exception 'Appointment already paid'; end if;
 select * into result from public.payments where appointment_id=p_appointment and status='pending' for update;
 if found then
  update public.payments set provider=p_provider,transaction_id=p_transaction,created_at=now() where id=result.id returning * into result;
 else
  if a.amount is null then raise exception 'Amount unavailable'; end if;
  insert into public.payments(appointment_id,provider,transaction_id,amount,currency,status)
  values(p_appointment,p_provider,p_transaction,a.amount,a.currency,'pending') returning * into result;
 end if;
 insert into public.audit_logs(user_id,action,table_name,record_id) values(p_actor,'create','payments',result.id);
 return to_jsonb(result);
end $$;

create or replace function public.clinic_payment_status(p_actor uuid,p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.payments;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','super_admin')) then raise insufficient_privilege; end if;
 if p_status not in ('paid','refunded','failed') then raise exception 'Invalid payment status'; end if;
 select * into result from public.payments where id=p_id for update;
 if not found then raise exception 'Payment not found'; end if;
 update public.payments set status=p_status::public.payment_status where id=p_id returning * into result;
 update public.appointments set payment_status=p_status::public.payment_status,updated_at=now() where id=result.appointment_id;
 insert into public.audit_logs(user_id,action,table_name,record_id) values(p_actor,p_status,'payments',p_id);
 return to_jsonb(result);
end $$;

create or replace function public.clinic_match_knowledge(p_embedding extensions.vector(1536),p_model text,p_specialty uuid default null,p_doctor uuid default null,p_language text default null)
returns table(id uuid,document_id uuid,title text,content text,similarity float)
language sql stable security invoker set search_path = '' as $$
 select c.id,c.document_id,d.title,c.content,1-(c.embedding operator(extensions.<=>) p_embedding) as similarity
 from public.knowledge_chunks c join public.knowledge_documents d on d.id=c.document_id
 where d.active and d.status='completed' and d.embedding_model=p_model
 and (p_specialty is null or d.specialty_id=p_specialty or d.specialty_id is null)
 and (p_doctor is null or d.doctor_id=p_doctor or d.doctor_id is null)
 and (p_language is null or d.language=p_language)
 and c.embedding is not null
 order by c.embedding operator(extensions.<=>) p_embedding limit 6
$$;

-- All application data access is via the authenticated FastAPI boundary.
-- Prevent direct API writes from bypassing its validation or role checks.
do $$ declare t text; f record; begin
 foreach t in array array['profiles','doctors','specialties','services','doctor_services','doctor_locations','availability_slots','appointments','payments','sal_conversations','sal_messages','knowledge_documents','knowledge_chunks','audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
  execute format('grant all on table public.%I to service_role',t);
 end loop;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'clinic_%' loop
  execute format('revoke all on function %s from public, anon, authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
