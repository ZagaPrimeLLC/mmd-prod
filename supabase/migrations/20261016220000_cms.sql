-- ─── CMS: registered slots, immutable revisions, administrator publishing ─────
-- The registry of slots lives in src/lib/cms/slots.ts. Staff (ops) write draft
-- revisions; an administrator publishes one revision per slot. Keys under
-- `settings.` are administrator-only even for drafts. The public site reads
-- only through cms_published_content().

create table if not exists proj_mmd.cms_revisions (
  id           uuid primary key default gen_random_uuid(),
  slot_key     text not null,
  content      jsonb not null,
  status       text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  note         text,
  author_id    uuid not null,
  created_at   timestamptz not null default now(),
  published_at timestamptz,
  published_by uuid
);
create index if not exists cms_revisions_slot_idx on proj_mmd.cms_revisions (slot_key, created_at desc);

-- One row per slot that has ever been published: the pointer to the live revision.
create table if not exists proj_mmd.cms_entries (
  slot_key              text primary key,
  published_revision_id uuid not null references proj_mmd.cms_revisions (id),
  lock_version          integer not null default 1,
  updated_at            timestamptz not null default now()
);

-- What the public site renders. Null until the slot has been published.
create or replace function proj_mmd.cms_published_content(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select r.content
  from proj_mmd.cms_entries e
  join proj_mmd.cms_revisions r on r.id = e.published_revision_id
  where e.slot_key = p_key and r.status = 'published'
$$;
revoke all on function proj_mmd.cms_published_content(text) from public;
grant execute on function proj_mmd.cms_published_content(text) to anon, authenticated;

-- Publishing is one transaction: archive what was live, mark the chosen revision
-- published, move the pointer, note it on the analytics timeline and in the
-- activity log. Restoring an archived revision is the same operation.
create or replace function proj_mmd.cms_publish(p_revision uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r proj_mmd.cms_revisions%rowtype;
  actor uuid := (select auth.uid());
begin
  if not proj_mmd.has_role('mmd', array['admin']) then
    raise exception 'Only an administrator can publish.';
  end if;
  select * into r from proj_mmd.cms_revisions where id = p_revision for update;
  if not found then raise exception 'That revision no longer exists.'; end if;
  if r.status = 'published' then return jsonb_build_object('slot_key', r.slot_key, 'already', true); end if;

  update proj_mmd.cms_revisions set status = 'archived'
    where slot_key = r.slot_key and status = 'published' and id <> r.id;
  update proj_mmd.cms_revisions
    set status = 'published', published_at = now(), published_by = actor
    where id = r.id;
  insert into proj_mmd.cms_entries (slot_key, published_revision_id, lock_version, updated_at)
    values (r.slot_key, r.id, 1, now())
    on conflict (slot_key) do update
      set published_revision_id = excluded.published_revision_id,
          lock_version = proj_mmd.cms_entries.lock_version + 1,
          updated_at = now();
  insert into proj_mmd.web_annotations (kind, title, detail, created_by)
    values ('publish', 'Published: ' || r.slot_key, coalesce(nullif(p_note, ''), r.note), actor);
  insert into proj_mmd.activity_log (actor_id, verb, entity_type, entity_id, meta)
    values (actor, 'published', 'cms_slot', r.id, jsonb_build_object('slot', r.slot_key, 'revision', r.id, 'note', coalesce(nullif(p_note, ''), r.note)));
  return jsonb_build_object('slot_key', r.slot_key);
end
$$;
revoke all on function proj_mmd.cms_publish(uuid, text) from public;
grant execute on function proj_mmd.cms_publish(uuid, text) to authenticated;

-- ─── Access ────────────────────────────────────────────────────────────────
alter table proj_mmd.cms_revisions enable row level security;
alter table proj_mmd.cms_entries   enable row level security;

revoke all on proj_mmd.cms_revisions, proj_mmd.cms_entries from anon, authenticated;
grant select on proj_mmd.cms_entries to anon, authenticated;
grant select, insert, update on proj_mmd.cms_revisions to authenticated;
grant select on proj_mmd.cms_revisions to anon;

drop policy if exists cms_entries_read on proj_mmd.cms_entries;
create policy cms_entries_read on proj_mmd.cms_entries for select to anon, authenticated using (true);

drop policy if exists cms_revisions_public_read on proj_mmd.cms_revisions;
create policy cms_revisions_public_read on proj_mmd.cms_revisions
  for select to anon using (status = 'published');

drop policy if exists cms_revisions_member_read on proj_mmd.cms_revisions;
create policy cms_revisions_member_read on proj_mmd.cms_revisions
  for select to authenticated using (hub.is_member('mmd'));

-- Ops and admin draft; only admin touches settings.* slots.
drop policy if exists cms_revisions_draft_insert on proj_mmd.cms_revisions;
create policy cms_revisions_draft_insert on proj_mmd.cms_revisions
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status in ('draft', 'in_review')
    and (proj_mmd.has_role('mmd', array['admin']) or (proj_mmd.has_role('mmd', array['ops']) and slot_key not like 'settings.%'))
  );

-- Authors manage their own unpublished drafts; admins manage any unpublished revision.
-- Nobody sets 'published' this way: cms_publish() does.
drop policy if exists cms_revisions_draft_update on proj_mmd.cms_revisions;
create policy cms_revisions_draft_update on proj_mmd.cms_revisions
  for update to authenticated
  using (
    status in ('draft', 'in_review')
    and (proj_mmd.has_role('mmd', array['admin']) or (author_id = (select auth.uid()) and proj_mmd.has_role('mmd', array['ops'])))
  )
  with check (status in ('draft', 'in_review', 'archived'));
