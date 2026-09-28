-- Server-only access: browser roles cannot read customer records, sessions or files.
create table public.alpha_records(owner text not null,kind text not null,id text not null,payload text not null,updated bigint not null,primary key(owner,kind,id));
create table public.alpha_reservations(id text primary key,owner text not null,unit_id text not null,customer_id text not null,note text not null,status text not null,expires_at bigint not null,created_at bigint not null);
create index on public.alpha_reservations(owner,unit_id,status);
create table public.alpha_files(id text primary key,owner text not null,project_id text not null,kind text not null,name text not null,mime text not null,object_key text not null);
create index on public.alpha_files(owner);
create table public.alpha_sessions(token_hash text primary key,owner text not null,email text not null,expires bigint not null);
create table public.alpha_login_limits(id text primary key,attempts integer not null,reset_at bigint not null);
alter table public.alpha_records enable row level security;
alter table public.alpha_reservations enable row level security;
alter table public.alpha_files enable row level security;
alter table public.alpha_sessions enable row level security;
alter table public.alpha_login_limits enable row level security;
revoke all on public.alpha_records,public.alpha_reservations,public.alpha_files,public.alpha_sessions,public.alpha_login_limits from anon,authenticated;
grant all on public.alpha_records,public.alpha_reservations,public.alpha_files,public.alpha_sessions,public.alpha_login_limits to service_role;
create function public.alpha_reserve(p_id text,p_owner text,p_unit text,p_customer text,p_note text,p_expires bigint,p_now bigint) returns integer language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner||':'||p_unit,0));
 if exists(select 1 from public.alpha_reservations where owner=p_owner and unit_id=p_unit and (status='Đã bán' or (status='Đang giữ chỗ' and expires_at>p_now))) or exists(select 1 from public.alpha_records where owner=p_owner and kind='unit' and id=p_unit and payload::jsonb->>'status'='Đã bán') then return 0; end if;
 if not exists(select 1 from public.alpha_records where owner=p_owner and kind='customer' and id=p_customer) then return 0; end if;
 insert into public.alpha_reservations values(p_id,p_owner,p_unit,p_customer,p_note,'Đang giữ chỗ',p_expires,p_now);return 1;
end $$;
create function public.alpha_reservation(p_id text,p_owner text,p_operation text,p_now bigint) returns integer language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 if p_operation not in ('cancel','extend','sold') then return 0; end if;
 update public.alpha_reservations set status=case p_operation when 'cancel' then 'Đã hủy' when 'sold' then 'Đã bán' else 'Đang giữ chỗ' end,expires_at=case when p_operation='extend' then expires_at+86400000 else expires_at end where id=p_id and owner=p_owner and status='Đang giữ chỗ' and expires_at>p_now;
 get diagnostics n=row_count;return n;
end $$;
create function public.alpha_login_attempt(p_id text,p_now bigint) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.alpha_login_limits values(p_id,1,p_now+900000) on conflict(id) do update set attempts=case when alpha_login_limits.reset_at<=p_now then 1 else alpha_login_limits.attempts+1 end,reset_at=case when alpha_login_limits.reset_at<=p_now then p_now+900000 else alpha_login_limits.reset_at end returning attempts into n;
 return n<=20;
end $$;
revoke all on function public.alpha_reserve(text,text,text,text,text,bigint,bigint),public.alpha_reservation(text,text,text,bigint),public.alpha_login_attempt(text,bigint) from public,anon,authenticated;
grant execute on function public.alpha_reserve(text,text,text,text,text,bigint,bigint),public.alpha_reservation(text,text,text,bigint),public.alpha_login_attempt(text,bigint) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('alpha-assets','alpha-assets',false,4194304,array['image/jpeg','image/png','image/webp','application/pdf']);
