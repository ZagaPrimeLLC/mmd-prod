-- ─── Follow-up round 2 ──────────────────────────────────────────────────────
-- 1. Notification access by kind follows the roles each kind is sent to.
-- 2. The booking schedule check applies to website visitors and app users only
--    (anon / authenticated). Database administrators and the service role can
--    still correct a booking time or restore a backup.
-- 3. The check takes a shared lock (publishing office hours takes it
--    exclusively), so bookings no longer queue behind each other, and it runs
--    after the public-insert rate limit.
-- 4. A dedicated error code (MB001 slot unavailable, MB002 schedule
--    unavailable) so the website can tell these apart from other data checks.

begin;

-- 1 ────────────────────────────────────────────────────────────────────────
drop policy if exists notifications_current_lead_role on proj_mmd.notifications;
drop policy if exists notifications_current_role_by_kind on proj_mmd.notifications;
create policy notifications_current_role_by_kind on proj_mmd.notifications as restrictive for all to authenticated
  using (
    case
      when kind in ('inquiry', 'booking') then (select proj_mmd.has_role('mmd', array['admin', 'ops', 'leadership']))
      when kind in ('application', 'contact', 'newsletter') then (select proj_mmd.has_role('mmd', array['admin', 'ops']))
      when kind = 'review' then (select proj_mmd.has_role('mmd', array['admin']))
      else true
    end
  )
  with check (
    case
      when kind in ('inquiry', 'booking') then (select proj_mmd.has_role('mmd', array['admin', 'ops', 'leadership']))
      when kind in ('application', 'contact', 'newsletter') then (select proj_mmd.has_role('mmd', array['admin', 'ops']))
      when kind = 'review' then (select proj_mmd.has_role('mmd', array['admin']))
      else true
    end
  );

-- 2, 3, 4 ────────────────────────────────────────────────────────────────
-- to_char depends on settings, so the holiday helper is stable, not immutable.
alter function proj_mmd.office_closed_holiday(date) stable;

create or replace function proj_mmd.enforce_booking_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  s jsonb; wall timestamp; day date; minute int; opening int; closing int;
  -- PostgREST sets the request role with SET ROLE and the JWT claims; a
  -- security definer function changes current_user but not these.
  caller text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    nullif(current_setting('role', true), 'none'),
    '');
begin
  if caller not in ('anon', 'authenticated') then return new; end if;
  if tg_op = 'UPDATE' and new.requested_slot is not distinct from old.requested_slot then return new; end if;
  perform pg_advisory_xact_lock_shared(hashtext('cms_publish:settings.office_hours'));
  select r.content into s from proj_mmd.cms_entries e
    join proj_mmd.cms_revisions r on r.id = e.published_revision_id and r.status = 'published'
    where e.slot_key = 'settings.office_hours';
  if s is null then
    if exists (select 1 from proj_mmd.cms_entries where slot_key = 'settings.office_hours') then
      raise exception 'The office schedule is unavailable.' using errcode = 'MB002';
    end if;
    -- Explicit first-publication baseline, shared with DEFAULT_SCHEDULE in src/lib/booking.ts.
    s := '{"days":[2,4],"start":660,"end":960,"closed":[]}'::jsonb;
  end if;
  if jsonb_typeof(s -> 'days') is distinct from 'array' or jsonb_typeof(s -> 'closed') is distinct from 'array'
     or coalesce(s ->> 'start', '') !~ '^[0-9]{1,4}$' or coalesce(s ->> 'end', '') !~ '^[0-9]{1,4}$' then
    raise exception 'The office schedule is unavailable.' using errcode = 'MB002';
  end if;
  if new.requested_slot is null or not isfinite(new.requested_slot) then
    raise exception 'Choose an available consultation time.' using errcode = 'MB001';
  end if;
  opening := (s ->> 'start')::int; closing := (s ->> 'end')::int;
  wall := new.requested_slot at time zone 'America/New_York';
  day := wall::date;
  minute := extract(hour from wall)::int * 60 + extract(minute from wall)::int;
  if opening < 0 or closing > 1440 or opening >= closing
     or new.requested_slot < statement_timestamp() + interval '24 hours'
     or day >= (statement_timestamp() at time zone 'America/New_York')::date + 21
     or not (s -> 'days' @> jsonb_build_array(extract(dow from day)::int))
     or s -> 'closed' @> jsonb_build_array(to_char(day, 'YYYY-MM-DD'))
     or proj_mmd.office_closed_holiday(day)
     or minute < opening or minute + 45 > closing or (minute - opening) % 45 <> 0
     or extract(second from wall) <> 0 then
    raise exception 'That consultation time is no longer available. Refresh the schedule or call the office.' using errcode = 'MB001';
  end if;
  return new;
end $$;
revoke all on function proj_mmd.enforce_booking_schedule() from public, anon, authenticated;

-- Triggers fire in name order: bookings_attach_contact, limit_public_insert,
-- then this check, so a flood the rate limiter rejects never reaches the lock.
drop trigger if exists a_validate_booking_schedule on proj_mmd.bookings;
drop trigger if exists validate_booking_schedule on proj_mmd.bookings;
create trigger validate_booking_schedule before insert or update of requested_slot on proj_mmd.bookings
  for each row execute function proj_mmd.enforce_booking_schedule();

commit;
