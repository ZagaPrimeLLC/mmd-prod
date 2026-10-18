-- ─── Notifications: the bell in the CRM ─────────────────────────────────────
-- One row per recipient per event, written by triggers on the tables that
-- matter (inquiries, bookings, applications, contacts, newsletter, content
-- review, work assignments, comments). Members read and mark their own rows.

create table if not exists proj_mmd.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  kind        text not null,            -- inquiry, booking, application, contact, newsletter, review, assignment, comment
  title       text not null,
  body        text,
  href        text not null,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists notifications_user_idx on proj_mmd.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on proj_mmd.notifications (user_id) where read_at is null;

alter table proj_mmd.notifications enable row level security;
revoke all on proj_mmd.notifications from anon, authenticated;
grant select, delete on proj_mmd.notifications to authenticated;
grant update (read_at) on proj_mmd.notifications to authenticated;

drop policy if exists notifications_own_read on proj_mmd.notifications;
create policy notifications_own_read on proj_mmd.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_own_update on proj_mmd.notifications;
create policy notifications_own_update on proj_mmd.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists notifications_own_delete on proj_mmd.notifications;
create policy notifications_own_delete on proj_mmd.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- Fan out one event to every team member with one of the roles (null = everyone), optionally excluding the actor.
create or replace function proj_mmd.notify_members(
  p_roles text[], p_kind text, p_title text, p_body text, p_href text, p_entity_type text, p_entity_id uuid, p_exclude uuid default null
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into proj_mmd.notifications (user_id, kind, title, body, href, entity_type, entity_id)
  select tr.user_id, p_kind, left(p_title, 160), left(p_body, 300), p_href, p_entity_type, p_entity_id
  from proj_mmd.team_roles tr
  join hub.memberships m on m.user_id = tr.user_id and m.project_slug = 'mmd'
  where (p_roles is null or tr.role = any(p_roles))
    and (p_exclude is null or tr.user_id <> p_exclude);
$$;
revoke all on function proj_mmd.notify_members(text[], text, text, text, text, text, uuid, uuid) from public;

create or replace function proj_mmd.notify_one(
  p_user uuid, p_kind text, p_title text, p_body text, p_href text, p_entity_type text, p_entity_id uuid
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into proj_mmd.notifications (user_id, kind, title, body, href, entity_type, entity_id)
  select p_user, p_kind, left(p_title, 160), left(p_body, 300), p_href, p_entity_type, p_entity_id
  where p_user is not null;
$$;
revoke all on function proj_mmd.notify_one(uuid, text, text, text, text, text, uuid) from public;

-- ── Triggers ──────────────────────────────────────────────────────────────
create or replace function proj_mmd.trg_notify_inquiry() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(null, 'inquiry',
    'New inquiry from ' || coalesce(nullif(new.name, ''), 'the website'),
    concat_ws(' · ', nullif(new.service_interested, ''), left(coalesce(new.message, ''), 140)),
    '/dashboard/inbox', 'inquiry', new.id);
  return new;
end $$;
drop trigger if exists notify_inquiry on proj_mmd.inquiries;
create trigger notify_inquiry after insert on proj_mmd.inquiries for each row execute function proj_mmd.trg_notify_inquiry();

create or replace function proj_mmd.trg_notify_booking() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(null, 'booking',
    'Consultation requested by ' || coalesce(nullif(new.name, ''), 'a visitor'),
    to_char(new.requested_slot at time zone 'America/New_York', 'Dy Mon DD, HH12:MI am'),
    '/dashboard/inbox', 'booking', new.id);
  return new;
end $$;
drop trigger if exists notify_booking on proj_mmd.bookings;
create trigger notify_booking after insert on proj_mmd.bookings for each row execute function proj_mmd.trg_notify_booking();

create or replace function proj_mmd.trg_notify_application() returns trigger language plpgsql security definer set search_path = '' as $$
declare who text; job text;
begin
  select a.name into who from proj_mmd.applicants a where a.id = new.applicant_id;
  select j.title into job from proj_mmd.job_posts j where j.id = new.job_post_id;
  perform proj_mmd.notify_members(array['admin', 'ops'], 'application',
    'New application: ' || coalesce(who, 'applicant'),
    coalesce(job, 'General interest'),
    '/dashboard/recruitment', 'application', new.id);
  return new;
end $$;
drop trigger if exists notify_application on proj_mmd.applications;
create trigger notify_application after insert on proj_mmd.applications for each row execute function proj_mmd.trg_notify_application();

create or replace function proj_mmd.trg_notify_contact() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops'], 'contact',
    'New contact: ' || coalesce(nullif(new.full_name, ''), new.email, 'unnamed'),
    concat_ws(' · ', nullif(new.kind, ''), nullif(new.first_source, '')),
    '/dashboard/contacts', 'contact', new.id);
  return new;
end $$;
drop trigger if exists notify_contact on proj_mmd.contacts;
create trigger notify_contact after insert on proj_mmd.contacts for each row execute function proj_mmd.trg_notify_contact();

create or replace function proj_mmd.trg_notify_newsletter() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform proj_mmd.notify_members(array['admin', 'ops'], 'newsletter', 'Newsletter sign-up', new.email, '/dashboard/contacts', 'newsletter', new.id);
  return new;
end $$;
drop trigger if exists notify_newsletter on proj_mmd.newsletter_subscribers;
create trigger notify_newsletter after insert on proj_mmd.newsletter_subscribers for each row execute function proj_mmd.trg_notify_newsletter();

-- Content sent for review: administrators, except the author.
create or replace function proj_mmd.trg_notify_review() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'in_review' and (tg_op = 'INSERT' or old.status is distinct from 'in_review') then
    perform proj_mmd.notify_members(array['admin'], 'review',
      'Content awaiting review: ' || new.slot_key, coalesce(new.note, ''),
      '/dashboard/content/' || new.slot_key, 'cms_revision', new.id, new.author_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_review on proj_mmd.cms_revisions;
create trigger notify_review after insert or update of status on proj_mmd.cms_revisions for each row execute function proj_mmd.trg_notify_review();

-- Work assigned to you (not by you).
create or replace function proj_mmd.trg_notify_assignment() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id) and new.owner_id is distinct from (select auth.uid()) then
    perform proj_mmd.notify_one(new.owner_id, 'assignment', 'Assigned to you: ' || new.title, coalesce(new.notes, ''), '/dashboard/my-work', 'task', new.id);
  end if;
  return new;
end $$;
drop trigger if exists notify_assignment on proj_mmd.tasks;
create trigger notify_assignment after insert or update of owner_id on proj_mmd.tasks for each row execute function proj_mmd.trg_notify_assignment();

-- A comment on work you own (not your own comment).
create or replace function proj_mmd.trg_notify_comment() returns trigger language plpgsql security definer set search_path = '' as $$
declare t proj_mmd.tasks%rowtype;
begin
  select * into t from proj_mmd.tasks where id = new.task_id;
  if found and t.owner_id is not null and t.owner_id is distinct from (select auth.uid()) then
    perform proj_mmd.notify_one(t.owner_id, 'comment', 'New comment on: ' || t.title, left(new.body, 140), '/dashboard/my-work', 'task', t.id);
  end if;
  return new;
end $$;
drop trigger if exists notify_comment on proj_mmd.task_comments;
create trigger notify_comment after insert on proj_mmd.task_comments for each row execute function proj_mmd.trg_notify_comment();

-- ── Live updates and housekeeping ─────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'proj_mmd' and tablename = 'notifications') then
      alter publication supabase_realtime add table proj_mmd.notifications;
    end if;
  else
    raise notice 'supabase_realtime publication not found; the bell will poll instead of streaming.';
  end if;
end $$;

create or replace function proj_mmd.purge_notifications() returns void language sql security definer set search_path = '' as $$
  delete from proj_mmd.notifications where (read_at is not null and read_at < now() - interval '30 days') or created_at < now() - interval '90 days';
$$;
revoke all on function proj_mmd.purge_notifications() from public;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'mmd_purge_notifications';
    perform cron.schedule('mmd_purge_notifications', '50 7 * * *', $c$ select proj_mmd.purge_notifications() $c$);
  end if;
end $$;
