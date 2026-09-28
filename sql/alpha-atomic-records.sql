create unique index alpha_unit_code_unique on public.alpha_records(owner,((payload::jsonb)->>'projectId'),lower(trim((payload::jsonb)->>'code'))) where kind='unit';
create function public.alpha_save_records(p_rows jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare r jsonb; p jsonb; o text;
begin
 if jsonb_array_length(p_rows)>300 then raise exception 'Too many records'; end if;
 for o in select distinct value->>'owner' from jsonb_array_elements(p_rows) order by 1 loop perform pg_advisory_xact_lock(hashtextextended(o,0)); end loop;
 for r in select value from jsonb_array_elements(p_rows) loop
  p=(r->>'payload')::jsonb;
  if r->>'kind'='unit' and p->>'status'='Đã bán' and exists(select 1 from public.alpha_reservations where owner=r->>'owner' and unit_id=r->>'id' and status='Đang giữ chỗ' and expires_at>(extract(epoch from clock_timestamp())*1000)::bigint) then raise exception 'Unit has an active reservation'; end if;
  insert into public.alpha_records(owner,kind,id,payload,updated) values(r->>'owner',r->>'kind',r->>'id',r->>'payload',(r->>'updated')::bigint) on conflict(owner,kind,id) do update set payload=excluded.payload,updated=excluded.updated;
 end loop;
end $$;
revoke all on function public.alpha_save_records(jsonb) from public,anon,authenticated;
grant execute on function public.alpha_save_records(jsonb) to service_role;
create or replace function public.alpha_reserve(p_id text,p_owner text,p_unit text,p_customer text,p_note text,p_expires bigint,p_now bigint) returns integer language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner,0));
 if exists(select 1 from public.alpha_reservations where owner=p_owner and unit_id=p_unit and (status='Đã bán' or (status='Đang giữ chỗ' and expires_at>p_now))) or exists(select 1 from public.alpha_records where owner=p_owner and kind='unit' and id=p_unit and payload::jsonb->>'status'='Đã bán') then return 0; end if;
 if not exists(select 1 from public.alpha_records where owner=p_owner and kind='customer' and id=p_customer) then return 0; end if;
 insert into public.alpha_reservations values(p_id,p_owner,p_unit,p_customer,p_note,'Đang giữ chỗ',p_expires,p_now);return 1;
end $$;
