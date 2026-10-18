-- ─── Review fixes: analytics ingest key, safe casts, lead counts ─────────────

-- Only the website's own server may write events. The route sends a key from
-- its environment (ANALYTICS_INGEST_KEY); the database keeps only its hash.
create table if not exists proj_mmd.ingest_secrets (
  name       text primary key,
  key_hash   bytea not null,
  created_at timestamptz not null default now()
);
alter table proj_mmd.ingest_secrets enable row level security;
revoke all on proj_mmd.ingest_secrets from anon, authenticated;

-- Numeric properties arrive as numbers; strings that are not plain integers are dropped.
create or replace function proj_mmd.web_allowed_props(p_event text, p jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce((
    select jsonb_object_agg(k,
      case
        when k in ('seconds', 'depth', 'pct') then
          case when jsonb_typeof(p -> k) = 'number' then to_jsonb(least(greatest(floor((p ->> k)::numeric), 0), 1000000)::integer)
               when (p ->> k) ~ '^\d{1,7}$' then to_jsonb((p ->> k)::integer)
               else null end
        when jsonb_typeof(p -> k) = 'number' then p -> k
        else to_jsonb(left(p ->> k, 120))
      end)
    from unnest(case p_event
      when 'page_view'          then array['title']
      when 'section_impression' then array['slot']
      when 'cta_impression'     then array['cta_id', 'placement_id']
      when 'cta_click'          then array['cta_id', 'placement_id', 'href']
      when 'contact_action'     then array['kind']
      when 'form_start'         then array['form']
      when 'form_error'         then array['form', 'category']
      when 'scroll_depth'       then array['depth']
      when 'engaged_time'       then array['seconds']
      when 'video_progress'     then array['video', 'pct']
      when 'outbound_click'     then array['host']
      when 'download_click'     then array['file']
      else array[]::text[] end) as k
    where jsonb_typeof(p) = 'object' and p ? k and jsonb_typeof(p -> k) in ('string', 'number')
      and not (k in ('seconds', 'depth', 'pct') and jsonb_typeof(p -> k) = 'string' and not ((p ->> k) ~ '^\d{1,7}$'))
  ), '{}'::jsonb)
$$;
revoke execute on function proj_mmd.web_allowed_props(text, jsonb) from public, anon, authenticated;

/** Engaged seconds from stored props, never raising. */
create or replace function proj_mmd.web_seconds(p jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(p -> 'seconds') = 'number' then least(greatest(floor((p ->> 'seconds')::numeric), 0), 1800)::integer
              when (p ->> 'seconds') ~ '^\d{1,6}$' then least((p ->> 'seconds')::integer, 1800)
              else 0 end
$$;
revoke execute on function proj_mmd.web_seconds(jsonb) from public, anon, authenticated;

drop function if exists proj_mmd.ingest_web_events(jsonb, jsonb);
create or replace function proj_mmd.ingest_web_events(p_events jsonb, p_meta jsonb, p_key text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  e        jsonb;
  n        integer := 0;
  sid      text;
  ev       text;
  p        text;
  eid      text;
  t        timestamptz;
  props    jsonb;
  v_bot    boolean := coalesce((p_meta ->> 'is_bot')::boolean, false);
  v_staff  boolean := coalesce((p_meta ->> 'is_staff')::boolean, false);
  v_prev   boolean := coalesce((p_meta ->> 'is_preview')::boolean, false);
  allowed  text[] := array['page_view','section_impression','cta_impression','cta_click','contact_action',
                           'form_start','form_error','scroll_depth','engaged_time','video_progress',
                           'outbound_click','download_click'];
  recent   integer;
begin
  if p_key is null or not exists (
    select 1 from proj_mmd.ingest_secrets s where s.name = 'analytics' and s.key_hash = extensions.digest(p_key, 'sha256')
  ) then
    raise exception 'invalid ingest key' using errcode = '28000';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 then
    return 0;
  end if;

  for e in select * from jsonb_array_elements(p_events) loop
    if jsonb_typeof(e) <> 'object' then continue; end if;
    sid := e ->> 'sid';  ev := e ->> 'event';  p := e ->> 'path';  eid := e ->> 'id';
    if sid is null or sid !~ '^[A-Za-z0-9_-]{8,64}$' then continue; end if;
    if eid is null or length(eid) > 96 then continue; end if;
    if ev is null or not (ev = any(allowed)) then continue; end if;
    if p is null or p !~ '^/[A-Za-z0-9/_.%-]{0,200}$' or p like '/dashboard%' or p like '/api/%' then continue; end if;

    begin
      t := (e ->> 'ts')::timestamptz;
    exception when others then
      t := now();
    end;
    if t is null or t > now() + interval '5 minutes' or t < now() - interval '1 day' then t := now(); end if;

    select count(*) into recent from proj_mmd.web_events w where w.session_id = sid and w.received_at > now() - interval '1 minute';
    if recent > 600 then return n; end if;

    props := proj_mmd.web_allowed_props(ev, coalesce(e -> 'props', '{}'::jsonb));

    insert into proj_mmd.web_sessions
      (session_id, started_at, last_seen_at, landing_path, ref_host, utm_source, utm_medium, utm_campaign,
       device, country, region, is_bot, is_staff, is_preview)
    values
      (sid, t, t, p, left(p_meta ->> 'ref_host', 120), left(p_meta ->> 'utm_source', 80), left(p_meta ->> 'utm_medium', 80),
       left(p_meta ->> 'utm_campaign', 120), left(p_meta ->> 'device', 16), left(p_meta ->> 'country', 8),
       left(p_meta ->> 'region', 16), v_bot, v_staff, v_prev)
    on conflict (session_id) do update set
      last_seen_at = greatest(proj_mmd.web_sessions.last_seen_at, excluded.last_seen_at),
      is_bot       = proj_mmd.web_sessions.is_bot or excluded.is_bot,
      is_staff     = proj_mmd.web_sessions.is_staff or excluded.is_staff,
      is_preview   = proj_mmd.web_sessions.is_preview or excluded.is_preview;

    insert into proj_mmd.web_events (event_id, session_id, ts, event, path, page_id, revision_id, props, is_bot, is_staff, is_preview)
    values (eid, sid, t, ev, p, left(e ->> 'page_id', 80), left(e ->> 'revision_id', 80), props, v_bot, v_staff, v_prev)
    on conflict (event_id) do nothing;

    if found then
      n := n + 1;
      update proj_mmd.web_sessions set
        events          = events + 1,
        page_views      = page_views + (ev = 'page_view')::integer,
        engaged_seconds = engaged_seconds + case when ev = 'engaged_time' then proj_mmd.web_seconds(props) else 0 end
      where session_id = sid;
    end if;
  end loop;
  return n;
end
$$;
revoke all on function proj_mmd.ingest_web_events(jsonb, jsonb, text) from public;
grant execute on function proj_mmd.ingest_web_events(jsonb, jsonb, text) to anon, authenticated;

-- Rollups: same safe cast.
create or replace function proj_mmd.rollup_web(p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d0 timestamptz := (p_day::timestamp) at time zone 'America/New_York';
  d1 timestamptz := ((p_day + 1)::timestamp) at time zone 'America/New_York';
begin
  delete from proj_mmd.web_daily         where day = p_day;
  delete from proj_mmd.web_daily_pages   where day = p_day;
  delete from proj_mmd.web_daily_sources where day = p_day;
  delete from proj_mmd.web_daily_ctas    where day = p_day;

  insert into proj_mmd.web_daily (day, sessions, page_views, cta_impressions, cta_clicks, contact_actions, form_starts, engaged_seconds, updated_at)
  select p_day,
    (select count(*) from proj_mmd.web_sessions s
      where s.started_at >= d0 and s.started_at < d1 and not s.is_bot and not s.is_staff and not s.is_preview),
    count(*) filter (where e.event = 'page_view'),
    count(*) filter (where e.event = 'cta_impression'),
    count(*) filter (where e.event = 'cta_click'),
    count(*) filter (where e.event = 'contact_action'),
    count(*) filter (where e.event = 'form_start'),
    coalesce(sum(case when e.event = 'engaged_time' then proj_mmd.web_seconds(e.props) end), 0),
    now()
  from proj_mmd.web_events e
  where e.ts >= d0 and e.ts < d1 and not e.is_bot and not e.is_staff and not e.is_preview;

  insert into proj_mmd.web_daily_pages (day, path, page_views, sessions, engaged_seconds)
  select p_day, e.path,
    count(*) filter (where e.event = 'page_view'),
    count(distinct e.session_id) filter (where e.event = 'page_view'),
    coalesce(sum(case when e.event = 'engaged_time' then proj_mmd.web_seconds(e.props) end), 0)
  from proj_mmd.web_events e
  where e.ts >= d0 and e.ts < d1 and not e.is_bot and not e.is_staff and not e.is_preview
    and e.event in ('page_view', 'engaged_time')
  group by e.path
  having count(*) filter (where e.event = 'page_view') > 0;

  insert into proj_mmd.web_daily_sources (day, source, medium, sessions, page_views)
  select p_day,
    coalesce(s.utm_source, s.ref_host, 'direct'),
    coalesce(s.utm_medium, case when s.ref_host is not null then 'referral' else 'none' end),
    count(*), coalesce(sum(s.page_views), 0)
  from proj_mmd.web_sessions s
  where s.started_at >= d0 and s.started_at < d1 and not s.is_bot and not s.is_staff and not s.is_preview
  group by 2, 3;

  insert into proj_mmd.web_daily_ctas (day, cta_id, placement_id, impressions, impression_sessions, clicks, click_sessions)
  select p_day, coalesce(e.props ->> 'cta_id', '?'), coalesce(e.props ->> 'placement_id', 'default'),
    count(*) filter (where e.event = 'cta_impression'),
    count(distinct e.session_id) filter (where e.event = 'cta_impression'),
    count(*) filter (where e.event = 'cta_click'),
    count(distinct e.session_id) filter (where e.event = 'cta_click')
  from proj_mmd.web_events e
  where e.ts >= d0 and e.ts < d1 and not e.is_bot and not e.is_staff and not e.is_preview
    and e.event in ('cta_impression', 'cta_click')
  group by 2, 3;
end
$$;
revoke all on function proj_mmd.rollup_web(date) from public, anon, authenticated;

-- Saved requests in a period, counted in SQL (no row cap), with converted
-- sessions restricted to measured, non-excluded sessions. Members only (RLS).
create or replace function proj_mmd.web_lead_counts(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with inq as (select session_id from proj_mmd.inquiries where created_at >= p_from and created_at < p_to),
       bk  as (select session_id from proj_mmd.bookings  where created_at >= p_from and created_at < p_to),
       both_ as (select session_id from inq union all select session_id from bk)
  select jsonb_build_object(
    'inquiries', (select count(*) from inq),
    'bookings', (select count(*) from bk),
    'applications', (select count(*) from proj_mmd.applications where created_at >= p_from and created_at < p_to),
    'newsletter', (select count(*) from proj_mmd.newsletter_subscribers where created_at >= p_from and created_at < p_to),
    'unlinked', (select count(*) from both_ where session_id is null),
    'converted_sessions', (select count(distinct b.session_id) from both_ b
                            join proj_mmd.web_sessions s on s.session_id = b.session_id
                            where not s.is_bot and not s.is_staff and not s.is_preview)
  )
$$;
revoke all on function proj_mmd.web_lead_counts(timestamptz, timestamptz) from public, anon;
grant execute on function proj_mmd.web_lead_counts(timestamptz, timestamptz) to authenticated;
