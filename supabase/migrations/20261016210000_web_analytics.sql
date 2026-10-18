-- ─── Website analytics, first party ─────────────────────────────────────────
-- Events from the public site arrive through /api/t and proj_mmd.ingest_web_events,
-- which validates every event against the allowlist in src/lib/analytics/events.ts.
-- No cookies, no IP addresses, no third party: a random per-tab session id is the
-- only identifier, and it is also the only link between a visit and a saved lead.
-- Raw events and sessions live 90 days; daily rollups live 25 months.

-- Sessions: one per tab, renewed after 30 idle minutes (see lib/analytics/session.ts).
create table if not exists proj_mmd.web_sessions (
  session_id      text primary key,
  started_at      timestamptz not null,
  last_seen_at    timestamptz not null,
  landing_path    text not null,
  ref_host        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  device          text,
  country         text,
  region          text,
  page_views      integer not null default 0,
  events          integer not null default 0,
  engaged_seconds integer not null default 0,
  is_bot          boolean not null default false,
  is_staff        boolean not null default false,
  is_preview      boolean not null default false
);
create index if not exists web_sessions_started_idx on proj_mmd.web_sessions (started_at);
create index if not exists web_sessions_last_seen_idx on proj_mmd.web_sessions (last_seen_at);

create table if not exists proj_mmd.web_events (
  id          bigint generated always as identity primary key,
  event_id    text not null unique,            -- client id: a resent batch never counts twice
  session_id  text not null references proj_mmd.web_sessions (session_id) on delete cascade,
  ts          timestamptz not null,            -- when it happened in the browser (bounded by the server)
  received_at timestamptz not null default now(),
  event       text not null,
  path        text not null,
  page_id     text,
  revision_id text,                            -- the published CMS revision on screen, once the CMS exists
  props       jsonb not null default '{}'::jsonb,
  is_bot      boolean not null default false,
  is_staff    boolean not null default false,
  is_preview  boolean not null default false
);
create index if not exists web_events_ts_idx on proj_mmd.web_events (ts);
create index if not exists web_events_received_idx on proj_mmd.web_events (received_at);
create index if not exists web_events_session_idx on proj_mmd.web_events (session_id);
create index if not exists web_events_event_ts_idx on proj_mmd.web_events (event, ts);

-- Things the team did that may explain a change in the numbers.
create table if not exists proj_mmd.web_annotations (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  kind       text not null,                    -- publish, campaign, note
  title      text not null,
  detail     text,
  created_by uuid
);
create index if not exists web_annotations_at_idx on proj_mmd.web_annotations (at);

-- Daily rollups (America/New_York days), recomputed from raw rows; exclude bots, staff and previews.
create table if not exists proj_mmd.web_daily (
  day             date primary key,
  sessions        integer not null default 0,
  page_views      integer not null default 0,
  cta_impressions integer not null default 0,
  cta_clicks      integer not null default 0,
  contact_actions integer not null default 0,
  form_starts     integer not null default 0,
  engaged_seconds bigint  not null default 0,
  updated_at      timestamptz not null default now()
);
create table if not exists proj_mmd.web_daily_pages (
  day             date not null,
  path            text not null,
  page_views      integer not null default 0,
  sessions        integer not null default 0,
  engaged_seconds bigint  not null default 0,
  primary key (day, path)
);
create table if not exists proj_mmd.web_daily_sources (
  day        date not null,
  source     text not null,
  medium     text not null,
  sessions   integer not null default 0,
  page_views integer not null default 0,
  primary key (day, source, medium)
);
create table if not exists proj_mmd.web_daily_ctas (
  day                 date not null,
  cta_id              text not null,
  placement_id        text not null,
  impressions         integer not null default 0,
  impression_sessions integer not null default 0,
  clicks              integer not null default 0,
  click_sessions      integer not null default 0,
  primary key (day, cta_id, placement_id)
);

-- The lead's link to the visit that produced it. Applications stay unlinked for now
-- (they arrive through apply_to_job); recruitment is reported separately anyway.
alter table proj_mmd.inquiries              add column if not exists session_id text;
alter table proj_mmd.bookings               add column if not exists session_id text;
alter table proj_mmd.newsletter_subscribers add column if not exists session_id text;
create index if not exists inquiries_session_idx on proj_mmd.inquiries (session_id) where session_id is not null;
create index if not exists bookings_session_idx  on proj_mmd.bookings (session_id) where session_id is not null;

-- ─── Ingest ────────────────────────────────────────────────────────────────

-- Keeps only the properties the contract allows for this event, clipped.
create or replace function proj_mmd.web_allowed_props(p_event text, p jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce((
    select jsonb_object_agg(k, case when jsonb_typeof(p -> k) = 'number' then p -> k else to_jsonb(left(p ->> k, 120)) end)
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
  ), '{}'::jsonb)
$$;

-- Called by /api/t with up to 50 events and the server's classification of the
-- request (device, country, bot/staff/preview flags). Returns how many were new.
create or replace function proj_mmd.ingest_web_events(p_events jsonb, p_meta jsonb)
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
  v_bot    boolean := coalesce((p_meta ->> 'is_bot')::boolean, false);
  v_staff  boolean := coalesce((p_meta ->> 'is_staff')::boolean, false);
  v_prev   boolean := coalesce((p_meta ->> 'is_preview')::boolean, false);
  allowed  text[] := array['page_view','section_impression','cta_impression','cta_click','contact_action',
                           'form_start','form_error','scroll_depth','engaged_time','video_progress',
                           'outbound_click','download_click'];
  recent   integer;
begin
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

    -- A runaway client: more than 600 events a minute from one session is not a visitor.
    select count(*) into recent from proj_mmd.web_events w where w.session_id = sid and w.received_at > now() - interval '1 minute';
    if recent > 600 then return n; end if;

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
    values (eid, sid, t, ev, p, left(e ->> 'page_id', 80), left(e ->> 'revision_id', 80),
            proj_mmd.web_allowed_props(ev, coalesce(e -> 'props', '{}'::jsonb)), v_bot, v_staff, v_prev)
    on conflict (event_id) do nothing;

    if found then
      n := n + 1;
      update proj_mmd.web_sessions set
        events          = events + 1,
        page_views      = page_views + (ev = 'page_view')::integer,
        engaged_seconds = engaged_seconds + case when ev = 'engaged_time'
                            then least(greatest(coalesce((e -> 'props' ->> 'seconds')::integer, 0), 0), 1800) else 0 end
      where session_id = sid;
    end if;
  end loop;
  return n;
end
$$;

revoke all on function proj_mmd.web_allowed_props(text, jsonb) from public;
revoke all on function proj_mmd.ingest_web_events(jsonb, jsonb) from public;
grant execute on function proj_mmd.ingest_web_events(jsonb, jsonb) to anon, authenticated;

-- ─── Rollups and retention ─────────────────────────────────────────────────

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
    coalesce(sum(case when e.event = 'engaged_time' then least(coalesce((e.props ->> 'seconds')::integer, 0), 1800) end), 0),
    now()
  from proj_mmd.web_events e
  where e.ts >= d0 and e.ts < d1 and not e.is_bot and not e.is_staff and not e.is_preview;

  insert into proj_mmd.web_daily_pages (day, path, page_views, sessions, engaged_seconds)
  select p_day, e.path,
    count(*) filter (where e.event = 'page_view'),
    count(distinct e.session_id) filter (where e.event = 'page_view'),
    coalesce(sum(case when e.event = 'engaged_time' then least(coalesce((e.props ->> 'seconds')::integer, 0), 1800) end), 0)
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

-- 90 days of detail. The lead's link to its session goes with the session;
-- the lead itself is a business record and is kept by the CRM's own rules.
create or replace function proj_mmd.purge_web(p_days integer default 90)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff timestamptz := now() - make_interval(days => p_days);
  keep_rollups date := (now() at time zone 'America/New_York')::date - 760;  -- about 25 months
begin
  update proj_mmd.inquiries i set session_id = null
    where i.session_id in (select session_id from proj_mmd.web_sessions where last_seen_at < cutoff);
  update proj_mmd.bookings b set session_id = null
    where b.session_id in (select session_id from proj_mmd.web_sessions where last_seen_at < cutoff);
  update proj_mmd.newsletter_subscribers s set session_id = null
    where s.session_id in (select session_id from proj_mmd.web_sessions where last_seen_at < cutoff);
  delete from proj_mmd.web_sessions where last_seen_at < cutoff;   -- cascades to events
  delete from proj_mmd.web_events where ts < cutoff;
  delete from proj_mmd.web_daily         where day < keep_rollups;
  delete from proj_mmd.web_daily_pages   where day < keep_rollups;
  delete from proj_mmd.web_daily_sources where day < keep_rollups;
  delete from proj_mmd.web_daily_ctas    where day < keep_rollups;
  delete from proj_mmd.web_annotations   where at < (keep_rollups::timestamp at time zone 'America/New_York');
end
$$;

revoke all on function proj_mmd.rollup_web(date) from public;
revoke all on function proj_mmd.purge_web(integer) from public;

-- ─── Report helpers (run as the signed-in member; RLS applies) ─────────────

create or replace function proj_mmd.web_behavior(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ev as (
    select * from proj_mmd.web_events
    where ts >= p_from and ts < p_to and not is_bot and not is_staff and not is_preview
  )
  select jsonb_build_object(
    'page_views', (select count(*) from ev where event = 'page_view'),
    'scroll', (select coalesce(jsonb_object_agg(d, n), '{}'::jsonb) from
                (select props ->> 'depth' d, count(*) n from ev where event = 'scroll_depth' group by 1) s),
    'contact', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from
                (select coalesce(props ->> 'kind', '?') k, count(*) n from ev where event = 'contact_action' group by 1) s),
    'forms', (select coalesce(jsonb_agg(jsonb_build_object('form', f, 'starts', st, 'errors', er) order by st desc), '[]'::jsonb) from
                (select coalesce(props ->> 'form', 'form') f,
                        count(*) filter (where event = 'form_start') st,
                        count(*) filter (where event = 'form_error') er
                 from ev where event in ('form_start', 'form_error') group by 1) s),
    'video', (select coalesce(jsonb_agg(jsonb_build_object('video', v, 'pct', pct, 'n', n)), '[]'::jsonb) from
                (select coalesce(props ->> 'video', '?') v, props ->> 'pct' pct, count(*) n
                 from ev where event = 'video_progress' group by 1, 2) s),
    'slots', (select coalesce(jsonb_agg(jsonb_build_object('slot', sl, 'impressions', n, 'sessions', ss) order by n desc), '[]'::jsonb) from
                (select coalesce(props ->> 'slot', '?') sl, count(*) n, count(distinct session_id) ss
                 from ev where event = 'section_impression' group by 1) s),
    'outbound', (select coalesce(jsonb_agg(jsonb_build_object('host', h, 'n', n) order by n desc), '[]'::jsonb) from
                (select coalesce(props ->> 'host', '?') h, count(*) n from ev where event = 'outbound_click' group by 1 limit 20) s)
  )
$$;

create or replace function proj_mmd.web_sessions_breakdown(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with s as (
    select * from proj_mmd.web_sessions
    where started_at >= p_from and started_at < p_to and not is_bot and not is_staff and not is_preview
  )
  select jsonb_build_object(
    'sessions', (select count(*) from s),
    'device',  (select coalesce(jsonb_object_agg(coalesce(device, 'unknown'), n), '{}'::jsonb) from (select device, count(*) n from s group by 1) x),
    'country', (select coalesce(jsonb_agg(jsonb_build_object('k', coalesce(country, 'unknown'), 'n', n) order by n desc), '[]'::jsonb) from (select country, count(*) n from s group by 1 limit 15) x),
    'region',  (select coalesce(jsonb_agg(jsonb_build_object('k', coalesce(region, 'unknown'), 'n', n) order by n desc), '[]'::jsonb) from (select region, count(*) n from s where country = 'US' group by 1 limit 15) x),
    'landing', (select coalesce(jsonb_agg(jsonb_build_object('k', landing_path, 'n', n) order by n desc), '[]'::jsonb) from (select landing_path, count(*) n from s group by 1 order by 2 desc limit 15) x),
    'depth',   (select coalesce(jsonb_object_agg(b, n), '{}'::jsonb) from
                 (select case when page_views <= 1 then '1' when page_views = 2 then '2' when page_views <= 4 then '3-4' else '5+' end b, count(*) n from s group by 1) x)
  )
$$;

-- Sessions with activity in the last 30 minutes. Not a count of people online.
create or replace function proj_mmd.web_realtime()
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ev as (
    select * from proj_mmd.web_events
    where received_at >= now() - interval '30 minutes' and not is_bot and not is_staff and not is_preview
  )
  select jsonb_build_object(
    'at', now(),
    'sessions', (select count(distinct session_id) from ev),
    'page_views', (select count(*) from ev where event = 'page_view'),
    'per_minute', (select coalesce(jsonb_agg(jsonb_build_object('m', m, 'n', n) order by m), '[]'::jsonb) from
                   (select date_trunc('minute', received_at) m, count(*) filter (where event = 'page_view') n from ev group by 1) x),
    'paths', (select coalesce(jsonb_agg(jsonb_build_object('k', path, 'n', n) order by n desc), '[]'::jsonb) from
              (select path, count(distinct session_id) n from ev group by 1 order by 2 desc limit 10) x),
    'recent', (select coalesce(jsonb_agg(jsonb_build_object('ts', ts, 'event', event, 'path', path, 'props', props) order by ts desc), '[]'::jsonb) from
               (select ts, event, path, props from ev order by ts desc limit 25) x)
  )
$$;

revoke all on function proj_mmd.web_behavior(timestamptz, timestamptz) from public;
revoke all on function proj_mmd.web_sessions_breakdown(timestamptz, timestamptz) from public;
revoke all on function proj_mmd.web_realtime() from public;
grant execute on function proj_mmd.web_behavior(timestamptz, timestamptz) to authenticated;
grant execute on function proj_mmd.web_sessions_breakdown(timestamptz, timestamptz) to authenticated;
grant execute on function proj_mmd.web_realtime() to authenticated;

-- ─── Access ────────────────────────────────────────────────────────────────
-- Aggregate analytics: admin, ops and leadership. Nobody writes these tables
-- directly; the public site only reaches ingest_web_events.

alter table proj_mmd.web_sessions      enable row level security;
alter table proj_mmd.web_events        enable row level security;
alter table proj_mmd.web_annotations   enable row level security;
alter table proj_mmd.web_daily         enable row level security;
alter table proj_mmd.web_daily_pages   enable row level security;
alter table proj_mmd.web_daily_sources enable row level security;
alter table proj_mmd.web_daily_ctas    enable row level security;

revoke all on proj_mmd.web_sessions, proj_mmd.web_events, proj_mmd.web_annotations, proj_mmd.web_daily,
  proj_mmd.web_daily_pages, proj_mmd.web_daily_sources, proj_mmd.web_daily_ctas from anon, authenticated;
grant select on proj_mmd.web_sessions, proj_mmd.web_events, proj_mmd.web_annotations, proj_mmd.web_daily,
  proj_mmd.web_daily_pages, proj_mmd.web_daily_sources, proj_mmd.web_daily_ctas to authenticated;
grant insert on proj_mmd.web_annotations to authenticated;

do $$
declare t text;
begin
  foreach t in array array['web_sessions','web_events','web_annotations','web_daily','web_daily_pages','web_daily_sources','web_daily_ctas'] loop
    execute format('drop policy if exists %I on proj_mmd.%I', t || '_analytics_read', t);
    execute format(
      'create policy %I on proj_mmd.%I for select to authenticated using (proj_mmd.has_role(''mmd'', array[''admin'',''ops'',''leadership'']))',
      t || '_analytics_read', t);
  end loop;
end
$$;

drop policy if exists web_annotations_ops_insert on proj_mmd.web_annotations;
create policy web_annotations_ops_insert on proj_mmd.web_annotations
  for insert to authenticated
  with check (proj_mmd.has_role('mmd', array['admin', 'ops']) and created_by = (select auth.uid()));

-- ─── Schedules ─────────────────────────────────────────────────────────────
-- Today's rollup every 10 minutes, the last three days each night (late events),
-- retention each night. Times in UTC: 07:20/07:40 is 03:20/03:40 New York.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available here (%). Schedule rollup_web and purge_web another way.', sqlerrm;
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname in ('mmd_web_rollup_today', 'mmd_web_rollup_recent', 'mmd_web_purge');
  perform cron.schedule('mmd_web_rollup_today', '*/10 * * * *',
    $c$ select proj_mmd.rollup_web((now() at time zone 'America/New_York')::date) $c$);
  perform cron.schedule('mmd_web_rollup_recent', '20 7 * * *',
    $c$ select proj_mmd.rollup_web(d::date) from generate_series(
          ((now() at time zone 'America/New_York')::date - 3)::timestamp,
          ((now() at time zone 'America/New_York')::date - 1)::timestamp, interval '1 day') d $c$);
  perform cron.schedule('mmd_web_purge', '40 7 * * *', $c$ select proj_mmd.purge_web(90) $c$);
end
$$;
