import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { before, after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const database = `mmd-review-db-${randomUUID().slice(0, 8)}`;
const member = '00000000-0000-4000-8000-000000000001';
let started = false;
const migration = name => readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8');
const docker = (args, input) => execFileSync('docker', args, { input, encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const sql = input => docker(['exec', '-i', database, 'psql', '-X', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], input);
const asMember = input => sql(`set role authenticated; set request.jwt.claim.sub = '${member}'; ${input}`);
const completion = migration('20261017045004_review_completion');

before(async () => {
  docker(['run', '--detach', '--rm', '--pull=never', '--name', database, '--tmpfs', '/var/lib/postgresql/data', '--env', 'POSTGRES_PASSWORD=local-test-only', 'postgres:17-alpine']);
  started = true;
  for (let i = 0; i < 60; i++) {
    try { docker(['exec', database, 'pg_isready', '-U', 'postgres']); break; } catch { await delay(250); }
  }
  sql(`
    create role anon nologin; create role authenticated nologin;
    create schema proj_mmd; create schema hub; create schema auth; create schema extensions;
    create extension pgcrypto with schema extensions;
    grant usage on schema proj_mmd, hub, auth to anon, authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table hub.memberships(user_id uuid, project_slug text);
    insert into hub.memberships values ('${member}', 'mmd');
    create function hub.is_member(p text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from hub.memberships where user_id=auth.uid() and project_slug=p) $$;
    create function proj_mmd.has_role(p text, r text[]) returns boolean language sql stable as $$ select hub.is_member(p) $$;
    create table proj_mmd.inquiries(id uuid default gen_random_uuid(), created_at timestamptz, session_id text, service_interested text);
    create table proj_mmd.bookings(id uuid default gen_random_uuid(), created_at timestamptz, session_id text);
    create table proj_mmd.applications(id uuid default gen_random_uuid(), created_at timestamptz);
    create table proj_mmd.newsletter_subscribers(id uuid default gen_random_uuid(), created_at timestamptz);
    create table proj_mmd.activity_log(actor_id uuid, verb text, entity_type text, entity_id uuid, meta jsonb);
  `);
  sql(migration('20261016210000_web_analytics').split('-- The lead\'s link')[0]);
  sql(migration('20261016220000_cms'));
  sql(migration('20261016230000_notifications').split('-- Fan out')[0]);
  const fixes = migration('20261016260000_review_fixes');
  sql(fixes.slice(0, fixes.indexOf('drop function if exists proj_mmd.ingest_web_events')));
  sql(`insert into proj_mmd.ingest_secrets(name,key_hash) values ('analytics',extensions.digest('local-test-key','sha256'));
    grant select on proj_mmd.inquiries, proj_mmd.bookings, proj_mmd.applications, proj_mmd.newsletter_subscribers, proj_mmd.web_sessions to authenticated;`);
  sql(completion);
}, { timeout: 90000 });

after(() => { if (started) docker(['rm', '--force', database]); });

test('anonymous CMS reads reveal only published content through its RPC', () => {
  sql(`insert into proj_mmd.cms_revisions(id,slot_key,content,status,note,author_id) values ('${member}','home.hero','{"title":"Public heading"}','published','Private editorial note','${member}');
    insert into proj_mmd.cms_entries(slot_key,published_revision_id) values ('home.hero','${member}');`);
  assert.throws(() => sql('set role anon; select * from proj_mmd.cms_revisions;'), /permission denied/);
  assert.throws(() => sql('set role anon; select * from proj_mmd.cms_entries;'), /permission denied/);
  assert.deepEqual(JSON.parse(sql("set role anon; select proj_mmd.cms_published_content('home.hero');")), { title: 'Public heading' });
  assert.equal(asMember('select count(*) from proj_mmd.cms_entries;'), '1');
});

test('membership revocation removes read, update and delete access to old notifications', () => {
  sql(`insert into proj_mmd.notifications(user_id,kind,title,href) values ('${member}','inquiry','Fixture','/dashboard/inbox');`);
  assert.equal(asMember('select count(*) from proj_mmd.notifications;'), '1');
  sql(`delete from hub.memberships where user_id='${member}';`);
  try {
    assert.equal(asMember('select count(*) from proj_mmd.notifications;'), '0');
    assert.equal(asMember('update proj_mmd.notifications set read_at=now() returning id;'), '');
    assert.equal(asMember('delete from proj_mmd.notifications returning id;'), '');
    assert.equal(asMember('select count(*) from proj_mmd.cms_entries;'), '0');
  } finally { sql(`insert into hub.memberships values ('${member}','mmd');`); }
});

test('ingest enforces the server key, public paths, safe props and deduplication', () => {
  assert.throws(() => sql("set role anon; select proj_mmd.ingest_web_events('[]','{}','wrong');"), /invalid ingest key/);
  const events = [
    { id:'good', sid:'session-good', event:'page_view', path:'/' },
    { id:'private', sid:'session-private', event:'page_view', path:'/welcome/secret-token' },
    { id:'href', sid:'session-good', event:'cta_click', path:'/', props:{ cta_id:'fixture', href:'/welcome/secret-token', email:'private@example.test' } },
    { id:'numeric', sid:'session-good', event:'engaged_time', path:'/', props:{ seconds:'broken' } },
    { id:'legal', sid:'session-good', event:'page_view', path:'/notice-of-privacy-practices' },
  ];
  const ingest = `set role anon; select proj_mmd.ingest_web_events('${JSON.stringify(events)}','{}','local-test-key');`;
  assert.equal(sql(ingest), '4');
  assert.equal(sql(ingest), '0');
  assert.equal(sql("select count(*) from proj_mmd.web_sessions where session_id='session-private';"), '0');
  assert.deepEqual(JSON.parse(sql("select props from proj_mmd.web_events where event_id='href';")), { cta_id:'fixture' });
  assert.equal(sql("select engaged_seconds from proj_mmd.web_sessions where session_id='session-good';"), '0');
  assert.throws(() => sql('set role anon; select proj_mmd.rollup_web(current_date);'), /permission denied/);
});

test('quick clicks without qualifying impressions cannot push CTA click-through over 100%', () => {
  sql(`insert into proj_mmd.web_sessions(session_id,started_at,last_seen_at,landing_path) values ('ctr-seen',now(),now(),'/'),('ctr-quick',now(),now(),'/');
    insert into proj_mmd.web_events(event_id,session_id,ts,event,path,props) values
    ('ctr1','ctr-seen',now(),'cta_impression','/','{"cta_id":"header","placement_id":"mobile"}'),
    ('ctr2','ctr-seen',now(),'cta_click','/','{"cta_id":"header","placement_id":"mobile"}'),
    ('ctr3','ctr-quick',now(),'cta_click','/','{"cta_id":"header","placement_id":"mobile"}');
    select proj_mmd.rollup_web((now() at time zone 'America/New_York')::date);`);
  assert.equal(sql("select impressions||','||impression_sessions||','||clicks||','||click_sessions from proj_mmd.web_daily_ctas where cta_id='header';"), '1,1,2,1');
});

test('conversion denominator and numerator share a cohort and recruitment stays separate', () => {
  sql(`insert into proj_mmd.web_sessions(session_id,started_at,last_seen_at,landing_path,is_preview) values
    ('cohort-in','2026-09-05','2026-09-05','/',false),
    ('cohort-before','2026-08-31','2026-09-05','/',false),
    ('cohort-preview','2026-09-05','2026-09-05','/',true);
    insert into proj_mmd.inquiries(created_at,session_id,service_interested) values
    ('2026-09-05','cohort-in','care'),('2026-09-05','cohort-before','care'),('2026-09-05','cohort-preview','care'),
    ('2026-09-05',null,'dsp-application'),('2026-09-05',null,null);
    insert into proj_mmd.bookings(created_at,session_id) values ('2026-09-05','cohort-in');
    insert into proj_mmd.applications(created_at) values ('2026-09-05');`);
  const result = JSON.parse(asMember("select proj_mmd.web_lead_counts('2026-09-01','2026-10-01');"));
  assert.deepEqual(result, { inquiries:4, bookings:1, applications:2, newsletter:0, unlinked:1, measured_sessions:1, converted_sessions:1 });
});

test('completion migration can be reapplied without losing data', () => {
  sql("update proj_mmd.web_daily_ctas set click_sessions=99 where cta_id='header';");
  // The remote query CLI accepts one prepared statement, so also verify this atomic wrapper.
  sql(`do $review_migration$ begin\n${completion.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '')}\nend $review_migration$;`);
  assert.equal(sql('select count(*) from proj_mmd.notifications;'), '1');
  assert.equal(sql("select click_sessions from proj_mmd.web_daily_ctas where cta_id='header';"), '1');
});
