begin;

-- Match the automatic closure calendar in src/lib/booking.ts. Both actual and
-- observed fixed holidays are closed, plus the two company year-end closures.
create or replace function proj_mmd.office_closed_holiday(p_day date)
returns boolean language plpgsql immutable set search_path = '' as $$
declare y int := extract(year from p_day); yr int; fixed date; observed date;
  month_start date; holiday date; spec int[];
begin
  if to_char(p_day,'MM-DD') in ('12-24','12-31') then return true; end if;
  for yr in y..y+1 loop
    foreach spec slice 1 in array array[[1,1],[6,19],[7,4],[11,11],[12,25]] loop
      fixed := make_date(yr,spec[1],spec[2]);
      observed := fixed + case extract(dow from fixed) when 6 then -1 when 0 then 1 else 0 end;
      if p_day = fixed or p_day = observed then return true; end if;
    end loop;
  end loop;
  -- month, weekday (Sunday=0), occurrence; -1 means last weekday.
  foreach spec slice 1 in array array[[1,1,3],[2,1,3],[5,1,-1],[9,1,1],[10,1,2],[11,4,4]] loop
    month_start := make_date(y,spec[1],1);
    if spec[3] = -1 then
      holiday := (month_start + interval '1 month - 1 day')::date;
      holiday := holiday - ((extract(dow from holiday)::int - spec[2] + 7) % 7);
    else
      holiday := month_start + ((spec[2] - extract(dow from month_start)::int + 7) % 7) + (spec[3]-1)*7;
    end if;
    if p_day = holiday then return true; end if;
  end loop;
  return false;
end $$;
revoke all on function proj_mmd.office_closed_holiday(date) from public, anon, authenticated;

-- This trigger must see the approved schedule even for anonymous inserts.
-- It is not a callable API. The same lock as cms_publish serializes closures
-- against requests; updates to unrelated booking fields remain possible.
create or replace function proj_mmd.enforce_booking_schedule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s jsonb; wall timestamp; day date; minute int; opening int; closing int;
begin
  if tg_op = 'UPDATE' and new.requested_slot is not distinct from old.requested_slot then return new; end if;
  perform pg_advisory_xact_lock(hashtext('cms_publish:settings.office_hours'));
  select r.content into s from proj_mmd.cms_entries e
    join proj_mmd.cms_revisions r on r.id=e.published_revision_id and r.status='published'
    where e.slot_key='settings.office_hours';
  if s is null then
    if exists(select 1 from proj_mmd.cms_entries where slot_key='settings.office_hours') then
      raise exception 'The office schedule is unavailable.' using errcode='23514';
    end if;
    -- Explicit first-publication baseline, shared with DEFAULT_SCHEDULE.
    s := '{"days":[2,4],"start":660,"end":960,"closed":[]}'::jsonb;
  end if;
  if jsonb_typeof(s->'days') is distinct from 'array' or jsonb_typeof(s->'closed') is distinct from 'array'
     or coalesce(s->>'start','') !~ '^[0-9]{1,4}$' or coalesce(s->>'end','') !~ '^[0-9]{1,4}$' then
    raise exception 'The office schedule is unavailable.' using errcode='23514';
  end if;
  if new.requested_slot is null or not isfinite(new.requested_slot) then
    raise exception 'Choose an available consultation time.' using errcode='23514';
  end if;
  opening := (s->>'start')::int; closing := (s->>'end')::int;
  wall := new.requested_slot at time zone 'America/New_York';
  day := wall::date;
  minute := extract(hour from wall)::int * 60 + extract(minute from wall)::int;
  if new.requested_slot is null or not isfinite(new.requested_slot)
     or opening < 0 or closing > 1440 or opening >= closing
     or new.requested_slot < statement_timestamp() + interval '24 hours'
     or day >= (statement_timestamp() at time zone 'America/New_York')::date + 21
     or not (s->'days' @> jsonb_build_array(extract(dow from day)::int))
     or s->'closed' @> jsonb_build_array(to_char(day,'YYYY-MM-DD'))
     or proj_mmd.office_closed_holiday(day)
     or minute < opening or minute + 45 > closing or (minute-opening) % 45 <> 0
     or extract(second from wall) <> 0 then
    raise exception 'That consultation time is no longer available. Refresh the schedule or call the office.' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function proj_mmd.enforce_booking_schedule() from public, anon, authenticated;
drop trigger if exists a_validate_booking_schedule on proj_mmd.bookings;
create trigger a_validate_booking_schedule before insert or update of requested_slot on proj_mmd.bookings
  for each row execute function proj_mmd.enforce_booking_schedule();

-- Existing alerts follow the same current-role rule as new lead notifications.
-- Other notification kinds retain their existing membership/ownership checks.
drop policy if exists notifications_current_lead_role on proj_mmd.notifications;
create policy notifications_current_lead_role on proj_mmd.notifications as restrictive for all to authenticated
  using (kind not in ('inquiry','booking') or (select proj_mmd.has_role('mmd',array['admin','ops','leadership'])))
  with check (kind not in ('inquiry','booking') or (select proj_mmd.has_role('mmd',array['admin','ops','leadership'])));

-- One transaction and one row lock for conversion. Run as the caller so RLS
-- still controls the enquiry, board, task and board-item operations.
create or replace function proj_mmd.inquiry_to_task(p_inquiry uuid, p_board uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare i proj_mmd.inquiries%rowtype; v_task_id uuid; actor uuid := auth.uid();
  created boolean := false; card_notes text;
begin
  if actor is null or not proj_mmd.has_role('mmd',array['admin','ops']) then
    raise exception 'Your role cannot create work cards.' using errcode='42501';
  end if;
  select * into i from proj_mmd.inquiries where id=p_inquiry for update;
  if not found then raise exception 'That enquiry was not found.'; end if;
  if not exists(select 1 from proj_mmd.boards where id=p_board and not archived) then
    raise exception 'Choose an available board.';
  end if;
  select t.id into v_task_id from proj_mmd.tasks t where linked_type='inquiry' and linked_id=p_inquiry order by created_at,id limit 1;
  if v_task_id is null then
    card_notes := concat('From the website',case when i.source_page is not null then ' ('||i.source_page||')' end,
      case when i.cta is not null then ' via '||i.cta end,E'.\nReach them on ',
      coalesce(nullif(concat_ws(' / ',nullif(i.phone,''),nullif(i.email,'')),''),'no contact details given'),'.',
      case when i.service_interested is not null then E'\nAsked about: '||i.service_interested end,
      case when i.message is not null then E'\n\nWhat they wrote:\n'||i.message end);
    insert into proj_mmd.tasks(title,notes,work_type,priority,stage,due_at,created_by,owner_id,position,linked_type,linked_id,labels)
      values ('Follow up: '||i.name,left(card_notes,4000),'todo','high','todo',now()+interval '24 hours',actor,actor,
        extract(epoch from clock_timestamp())*1000,'inquiry',i.id,array['website-lead']) returning id into v_task_id;
    created := true;
  end if;
  -- Also recover a card left without a board by the old two-request action.
  if not exists(select 1 from proj_mmd.board_items bi where bi.task_id=v_task_id) then
    insert into proj_mmd.board_items(board_id,task_id,position,added_by)
      values(p_board,v_task_id,extract(epoch from clock_timestamp())*1000,actor);
  end if;
  if i.status='new' then update proj_mmd.inquiries set status='contacted',handled_at=now() where id=i.id; end if;
  return jsonb_build_object('id',v_task_id,'created',created);
end $$;
revoke all on function proj_mmd.inquiry_to_task(uuid,uuid) from public, anon, authenticated;
grant execute on function proj_mmd.inquiry_to_task(uuid,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
