-- New inquiries and bookings notify the people who work or watch the business
-- (admin, ops, leadership), not read-only viewers.
create or replace function proj_mmd.trg_notify_inquiry() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops', 'leadership'], 'inquiry',
    'New inquiry from ' || coalesce(nullif(new.name, ''), 'the website'),
    concat_ws(' · ', nullif(new.service_interested, ''), left(coalesce(new.message, ''), 140)),
    '/dashboard/inbox?c=inquiry:' || new.id, 'inquiry', new.id);
  return new;
end $$;

create or replace function proj_mmd.trg_notify_booking() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops', 'leadership'], 'booking',
    'Consultation requested by ' || coalesce(nullif(new.name, ''), 'a visitor'),
    to_char(new.requested_slot at time zone 'America/New_York', 'Dy Mon DD, HH12:MI am'),
    '/dashboard/inbox?c=booking:' || new.id, 'booking', new.id);
  return new;
end $$;
