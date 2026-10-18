-- ─── Inbox as conversations ────────────────────────────────────────────────
-- Star, archive and an internal thread for each lead. The thread holds staff
-- notes now; email, SMS and chat messages will join it later with their own
-- channel values, so the inbox shape does not change when sending arrives.

alter table proj_mmd.inquiries add column if not exists starred boolean not null default false;
alter table proj_mmd.inquiries add column if not exists archived_at timestamptz;
alter table proj_mmd.bookings  add column if not exists starred boolean not null default false;
alter table proj_mmd.bookings  add column if not exists archived_at timestamptz;

create table if not exists proj_mmd.lead_messages (
  id         uuid primary key default gen_random_uuid(),
  lead_type  text not null check (lead_type in ('inquiry', 'booking')),
  lead_id    uuid not null,
  channel    text not null default 'note' check (channel in ('note', 'email', 'sms', 'chat')),
  direction  text not null default 'internal' check (direction in ('internal', 'in', 'out')),
  body       text not null,
  author_id  uuid,
  created_at timestamptz not null default now()
);
create index if not exists lead_messages_lead_idx on proj_mmd.lead_messages (lead_type, lead_id, created_at);

alter table proj_mmd.lead_messages enable row level security;
revoke all on proj_mmd.lead_messages from anon, authenticated;
grant select, insert on proj_mmd.lead_messages to authenticated;
grant delete on proj_mmd.lead_messages to authenticated;

drop policy if exists lead_messages_member_read on proj_mmd.lead_messages;
create policy lead_messages_member_read on proj_mmd.lead_messages for select to authenticated using (hub.is_member('mmd'));
drop policy if exists lead_messages_ops_write on proj_mmd.lead_messages;
create policy lead_messages_ops_write on proj_mmd.lead_messages for insert to authenticated
  with check (proj_mmd.has_role('mmd', array['admin', 'ops']) and author_id = (select auth.uid()) and channel = 'note' and direction = 'internal');
drop policy if exists lead_messages_own_delete on proj_mmd.lead_messages;
create policy lead_messages_own_delete on proj_mmd.lead_messages for delete to authenticated
  using (channel = 'note' and (author_id = (select auth.uid()) or proj_mmd.has_role('mmd', array['admin'])));

-- Who can be assigned: every team member with their name and role.
create or replace function proj_mmd.team_members()
returns table (id uuid, display_name text, role text, job_title text)
language sql
stable
security definer
set search_path = ''
as $$
  select tr.user_id, p.display_name, tr.role, coalesce(tr.job_title, p.job_title)
  from proj_mmd.team_roles tr
  join hub.memberships m on m.user_id = tr.user_id and m.project_slug = 'mmd'
  left join proj_mmd.profiles p on p.id = tr.user_id
  where hub.is_member('mmd')
  order by p.display_name nulls last;
$$;
revoke all on function proj_mmd.team_members() from public;
grant execute on function proj_mmd.team_members() to authenticated;
