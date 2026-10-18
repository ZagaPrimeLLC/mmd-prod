-- ─── Review hardening ───────────────────────────────────────────────────────
-- Supabase grants EXECUTE on new functions to anon/authenticated by default
-- privileges, so "revoke from public" alone leaves them callable. Internal
-- maintenance functions become owner-only; report functions stay for members.

revoke execute on function proj_mmd.rollup_web(date) from anon, authenticated;
revoke execute on function proj_mmd.purge_web(integer) from anon, authenticated;
revoke execute on function proj_mmd.web_allowed_props(text, jsonb) from anon, authenticated;
revoke execute on function proj_mmd.notify_members(text[], text, text, text, text, text, uuid, uuid) from anon, authenticated;
revoke execute on function proj_mmd.notify_one(uuid, text, text, text, text, text, uuid) from anon, authenticated;
revoke execute on function proj_mmd.purge_notifications() from anon, authenticated;
revoke execute on function proj_mmd.web_behavior(timestamptz, timestamptz) from anon;
revoke execute on function proj_mmd.web_sessions_breakdown(timestamptz, timestamptz) from anon;
revoke execute on function proj_mmd.web_realtime() from anon;
revoke execute on function proj_mmd.team_members() from anon;
revoke execute on function proj_mmd.cms_publish(uuid, text) from anon;

-- A draft's slot, author and content are fixed once saved; only its status moves.
-- Without this an ops user could save a draft on an open slot and then move it
-- onto an administrator-only slot, or change the text after review.
revoke update on proj_mmd.cms_revisions from authenticated;
grant update (status) on proj_mmd.cms_revisions to authenticated;

-- Two administrators publishing the same slot at once: serialize per slot so
-- exactly one revision ends up published.
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
  select * into r from proj_mmd.cms_revisions where id = p_revision;
  if not found then raise exception 'That revision no longer exists.'; end if;
  perform pg_advisory_xact_lock(hashtext('cms_publish:' || r.slot_key));
  select * into r from proj_mmd.cms_revisions where id = p_revision for update;
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
revoke all on function proj_mmd.cms_publish(uuid, text) from public, anon;
grant execute on function proj_mmd.cms_publish(uuid, text) to authenticated;
