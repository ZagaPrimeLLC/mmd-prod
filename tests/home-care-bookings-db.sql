-- Self-rolling-back verification using real RLS and notification triggers.
-- All names/contact details below are synthetic; no test alert is committed.
do $$
declare
  s jsonb; slot timestamptz; booking_id uuid := gen_random_uuid();
  legacy_id uuid := gen_random_uuid(); inquiry_id uuid := gen_random_uuid();
  count_seen int; expected_recipients int; rejected boolean := false;
begin
 begin
  select coalesce(proj_mmd.cms_published_content('settings.office_hours'),
    '{"days":[2,4],"start":660,"end":960,"closed":[]}'::jsonb) into s;
  select (day::date::timestamp + minute * interval '1 minute') at time zone 'America/New_York' into slot
  from generate_series(((now() at time zone 'America/New_York')::date + 2)::timestamp,
    ((now() at time zone 'America/New_York')::date + 20)::timestamp, interval '1 day') day
  cross join generate_series((s->>'start')::int, (s->>'end')::int - 45, 45) minute
  where s->'days' @> jsonb_build_array(extract(dow from day)::int)
    and not (s->'closed' @> jsonb_build_array(to_char(day,'YYYY-MM-DD')))
    and not proj_mmd.office_closed_holiday(day::date)
  order by day,minute limit 1;
  if slot is null then raise exception 'No testable booking slot in current office schedule'; end if;

  select count(*) into expected_recipients from proj_mmd.team_roles tr
  join hub.memberships m on m.user_id=tr.user_id and m.project_slug='mmd'
  where tr.role in ('admin','ops','leadership');
  if expected_recipients=0 then raise exception 'No recipients available to verify notification fan-out'; end if;

  -- New website: column wins over stale metadata, campaign tags survive.
  perform set_config('request.headers','{"x-forwarded-for":"198.18.0.55"}',true);
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  execute 'set local role anon';
  insert into proj_mmd.bookings(id,name,email,phone,requested_slot,service_interested,attribution)
  values(booking_id,'Home care verification',booking_id||'@example.invalid','555-0100',slot,
    'home-health-aide','{"service":"respite","utm_source":"verification"}');
  begin
    select count(*) into count_seen from proj_mmd.bookings where id=booking_id;
  exception when insufficient_privilege then
    -- Both a missing SELECT grant and an RLS-filtered result deny public reads.
    count_seen := 0;
  end;
  if count_seen<>0 then raise exception 'Anonymous visitor can read a booking'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true);
  if not exists(select 1 from proj_mmd.bookings where id=booking_id
    and service_interested='home-health-aide' and attribution='{"utm_source":"verification"}'::jsonb)
    then raise exception 'Column selection or attribution cleanup failed'; end if;
  if (select count(*) from proj_mmd.notifications where entity_type='booking' and entity_id=booking_id
    and body like 'Home Health Aide Services · %')<>expected_recipients
    then raise exception 'Booking notification does not contain the readable service'; end if;

  -- Previously deployed form: accept legacy attribution while clients roll over.
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  execute 'set local role anon';
  insert into proj_mmd.bookings(id,name,email,phone,requested_slot,attribution)
  values(legacy_id,'Legacy form verification',legacy_id||'@example.invalid','555-0100',slot,
    '{"service":"community-support","utm_source":"verification"}');
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true);
  if not exists(select 1 from proj_mmd.bookings where id=legacy_id
    and service_interested='community-based-supports' and not attribution ? 'service')
    then raise exception 'Legacy form compatibility failed'; end if;

  -- Invalid direct choices are rejected by the real column constraint.
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  execute 'set local role anon';
  begin
    insert into proj_mmd.bookings(name,email,phone,requested_slot,service_interested)
    values('Invalid service verification',gen_random_uuid()||'@example.invalid','555-0100',slot,'not-a-service');
  exception when check_violation then rejected := true;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true);
  if not rejected then raise exception 'Invalid booking service was accepted'; end if;

  -- Updates can explicitly clear a selection without reviving stale JSON.
  update proj_mmd.bookings set service_interested=null,attribution='{"service":"respite"}' where id=booking_id;
  if not exists(select 1 from proj_mmd.bookings where id=booking_id and service_interested is null
    and attribution='{}'::jsonb) then raise exception 'Cleared selection was resurrected'; end if;
  update proj_mmd.bookings set service_interested='individual-support' where id=booking_id;
  if (select service_interested from proj_mmd.bookings where id=booking_id)<>'individual-supports'
    then raise exception 'Historical booking alias was not normalized'; end if;
  update proj_mmd.bookings set service_interested='other' where id=booking_id;
  if (select service_interested from proj_mmd.bookings where id=booking_id)<>'other'
    then raise exception 'Other service choice was lost'; end if;

  insert into proj_mmd.inquiries(id,name,email,phone,service_interested,message)
  values(inquiry_id,'Inquiry label verification',inquiry_id||'@example.invalid','555-0100','community-support','Synthetic verification');
  if (select count(*) from proj_mmd.notifications where entity_type='inquiry' and entity_id=inquiry_id
    and body='Community-Based Supports · Synthetic verification')<>expected_recipients
    then raise exception 'Inquiry notification exposes a raw service code'; end if;

  if exists(select 1 from proj_mmd.notifications n join proj_mmd.team_roles tr on tr.user_id=n.user_id
    where n.entity_id in (booking_id,legacy_id,inquiry_id) and tr.role not in ('admin','ops','leadership'))
    then raise exception 'Notification reached an unintended role'; end if;
  if has_function_privilege('anon','proj_mmd.normalize_booking_service()','execute')
    or has_function_privilege('anon','proj_mmd.service_name(text)','execute')
    or has_function_privilege('anon','proj_mmd.trg_notify_booking()','execute')
    then raise exception 'Internal helper exposed as public RPC'; end if;
  if (select prosecdef from pg_proc where oid='proj_mmd.normalize_booking_service()'::regprocedure)
    then raise exception 'Normalization must run with invoker privileges'; end if;
  raise exception 'Roll back verification fixtures' using errcode='ZX001';
 exception when sqlstate 'ZX001' then
  raise notice 'PASS: booking column, legacy clients, aliases, clear/other choices, constraints, RLS and notification labels/roles; all fixtures rolled back';
 end;
end $$;
