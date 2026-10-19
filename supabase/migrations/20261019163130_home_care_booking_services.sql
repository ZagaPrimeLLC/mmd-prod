-- Service selection belongs to the booking, independently of campaign metadata.
-- Nullable for undecided visitors and older bookings with no recorded choice.
alter table proj_mmd.bookings add column if not exists service_interested text;

create or replace function proj_mmd.booking_service_code(p_value text)
returns text language sql immutable set search_path = '' as $$
  select case nullif(btrim(p_value), '')
    when 'home-health-aide' then 'home-health-aide'
    when 'community-support' then 'community-based-supports'
    when 'community-based-supports' then 'community-based-supports'
    when 'individual-support' then 'individual-supports'
    when 'individual-supports' then 'individual-supports'
    when 'respite-care' then 'respite'
    when 'respite' then 'respite'
    when 'other' then 'other'
  end;
$$;

create or replace function proj_mmd.service_name(p_value text)
returns text language sql immutable set search_path = '' as $$
  select case btrim(p_value)
    when 'home-health-aide' then 'Home Health Aide Services'
    when 'community-support' then 'Community-Based Supports'
    when 'community-based-supports' then 'Community-Based Supports'
    when 'individual-support' then 'Individual Supports'
    when 'individual-supports' then 'Individual Supports'
    when 'respite-care' then 'Respite'
    when 'respite' then 'Respite'
    when 'other' then 'Something else'
    when 'dsp-application' then 'DSP application'
  end;
$$;

-- These are internal, data-free helpers. The trigger owner calls them;
-- they do not need to become new public RPCs under Supabase's default grants.
revoke all on function proj_mmd.booking_service_code(text) from public, anon, authenticated;
revoke all on function proj_mmd.service_name(text) from public, anon, authenticated;

-- Carry forward only a recorded, recognized selection. Do not infer a service
-- from an old CTA: visitors could have changed the dropdown after following it.
update proj_mmd.bookings
set service_interested = proj_mmd.booking_service_code(attribution->>'service'),
    attribution = attribution - 'service'
where service_interested is null
  and proj_mmd.booking_service_code(attribution->>'service') is not null;

alter table proj_mmd.bookings drop constraint if exists bookings_service_interested_check;
alter table proj_mmd.bookings add constraint bookings_service_interested_check
  check (service_interested is null or service_interested in
    ('home-health-aide','community-based-supports','individual-supports','respite','other'));

-- Compatibility for the previous deployed form: accept its legacy JSON value
-- on INSERT, normalize aliases, then keep the column as the single authority.
-- This trigger only changes NEW; it performs no privileged table reads/writes.
create or replace function proj_mmd.normalize_booking_service()
returns trigger language plpgsql set search_path = '' as $$
declare value text; legacy boolean := false;
begin
  if tg_op = 'INSERT' and new.service_interested is null then
    value := new.attribution->>'service';
    legacy := true;
  else
    value := new.service_interested;
  end if;
  new.service_interested := case btrim(value)
    when 'home-health-aide' then 'home-health-aide'
    when 'community-support' then 'community-based-supports'
    when 'community-based-supports' then 'community-based-supports'
    when 'individual-support' then 'individual-supports'
    when 'individual-supports' then 'individual-supports'
    when 'respite-care' then 'respite'
    when 'respite' then 'respite'
    when 'other' then 'other'
    else case when legacy then null else value end
  end;
  new.attribution := new.attribution - 'service';
  return new;
end $$;
revoke all on function proj_mmd.normalize_booking_service() from public, anon, authenticated;
drop trigger if exists normalize_booking_service on proj_mmd.bookings;
create trigger normalize_booking_service before insert or update of service_interested, attribution on proj_mmd.bookings
  for each row execute function proj_mmd.normalize_booking_service();

create or replace function proj_mmd.trg_notify_inquiry()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops', 'leadership'], 'inquiry',
    'New inquiry from ' || coalesce(nullif(new.name, ''), 'the website'),
    concat_ws(' · ', coalesce(proj_mmd.service_name(new.service_interested), 'General enquiry'), nullif(left(coalesce(new.message, ''), 140), '')),
    '/dashboard/inbox?c=inquiry:' || new.id, 'inquiry', new.id);
  return new;
end $$;

create or replace function proj_mmd.trg_notify_booking()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops', 'leadership'], 'booking',
    'Consultation requested by ' || coalesce(nullif(new.name, ''), 'a visitor'),
    concat_ws(' · ', coalesce(proj_mmd.service_name(new.service_interested), 'Consultation'),
      to_char(new.requested_slot at time zone 'America/New_York', 'Dy Mon DD, HH12:MI am')),
    '/dashboard/inbox?c=booking:' || new.id, 'booking', new.id);
  return new;
end $$;
revoke all on function proj_mmd.trg_notify_inquiry() from public, anon, authenticated;
revoke all on function proj_mmd.trg_notify_booking() from public, anon, authenticated;

-- Existing bell entries should show the same names. Preserve recipients,
-- timestamps, read state, titles, entity IDs and links; do not create alerts.
update proj_mmd.notifications n
set body = left(concat_ws(' · ', coalesce(proj_mmd.service_name(i.service_interested), 'General enquiry'), nullif(left(coalesce(i.message, ''), 140), '')), 300)
from proj_mmd.inquiries i
where n.kind = 'inquiry' and n.entity_type = 'inquiry' and n.entity_id = i.id;

update proj_mmd.notifications n
set body = left(concat_ws(' · ', coalesce(proj_mmd.service_name(b.service_interested), 'Consultation'),
  to_char(b.requested_slot at time zone 'America/New_York', 'Dy Mon DD, HH12:MI am')), 300)
from proj_mmd.bookings b
where n.kind = 'booking' and n.entity_type = 'booking' and n.entity_id = b.id;

notify pgrst, 'reload schema';
