import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

// Only disposable containers are used. No project credentials or databases are read.
const suffix = randomUUID().slice(0, 8);
const database = `mmd-rate-db-${suffix}`;
const rest = `mmd-rate-rest-${suffix}`;
const started = [];
let baseUrl;

function docker(args, input) {
  return execFileSync('docker', args, {
    input, encoding: 'utf8', windowsHide: true, timeout: 30_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function sql(query) {
  return docker(['exec', '-i', database, 'psql', '-X', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], query);
}

async function rpc(name, body, ip = '192.0.2.1') {
  const response = await fetch(`${baseUrl}/rpc/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  return { status: response.status, body: await response.json() };
}

function reset() {
  sql('truncate proj_mmd.rate_events, proj_mmd.test_ingestions; update proj_mmd.intake_keys set last_used_at = null;');
}

before(async () => {
  docker(['run', '--detach', '--rm', '--pull=never', '--name', database,
    '--tmpfs', '/var/lib/postgresql/data', '--publish', '127.0.0.1::3000',
    '--env', 'POSTGRES_PASSWORD=local-test-only', 'postgres:17-alpine']);
  started.push(database);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      docker(['exec', database, 'pg_isready', '-U', 'postgres']);
      ready = true;
      break;
    } catch { await delay(250); }
  }
  assert.ok(ready, 'The disposable PostgreSQL container must become ready');

  // Keep unrelated CRM tables out of this fixture. The ingestion stub records
  // whether authentication permitted a write; the rate and intake functions
  // themselves are loaded directly from the actual migration files.
  const hardening = readFileSync(new URL('../supabase/migrations/20261001000000_hardening.sql', import.meta.url), 'utf8');
  const clientIp = hardening.match(/create or replace function proj_mmd\.client_ip\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(clientIp);
  sql(`
    create role anon nologin;
    create role authenticated nologin;
    create schema proj_mmd;
    grant usage on schema proj_mmd to anon, authenticated;
    create table proj_mmd.rate_events (
      bucket text not null, subject text not null, created_at timestamptz not null default now()
    );
    alter table proj_mmd.rate_events enable row level security;
    create index on proj_mmd.rate_events (bucket, subject, created_at desc);
    create index on proj_mmd.rate_events (bucket, created_at desc);
    create table proj_mmd.intake_keys (
      id uuid primary key default gen_random_uuid(), key_hash text, source text,
      revoked_at timestamptz, last_used_at timestamptz
    );
    create table proj_mmd.test_ingestions (payload jsonb);
    create function proj_mmd._ingest_applicant(p jsonb, p_default_source text, p_actor uuid)
    returns jsonb language plpgsql as $$
    begin
      if nullif(p->>'name', '') is null then raise exception 'missing name'; end if;
      insert into proj_mmd.test_ingestions values (p);
      return jsonb_build_object('accepted', true);
    end; $$;
    revoke all on function proj_mmd._ingest_applicant(jsonb, text, uuid) from public;
    ${clientIp}
    revoke all on function proj_mmd.client_ip() from public;
    insert into proj_mmd.intake_keys (key_hash, source, revoked_at) values
      (encode(sha256(convert_to('valid-key', 'UTF8')), 'hex'), 'Test', null),
      (encode(sha256(convert_to('revoked-key', 'UTF8')), 'hex'), 'Test', now());
  `);
  sql(readFileSync(new URL('../supabase/migrations/20261001050307_rate_limit_fixes.sql', import.meta.url), 'utf8'));
  sql(`
    create function proj_mmd.rate_probe(p_subject text, p_per_subject int, p_global int)
    returns boolean language plpgsql security definer set search_path = '' as $$
    begin
      perform proj_mmd._rate_limit('test', p_per_subject, interval '10 minutes', p_global, interval '1 hour', p_subject);
      -- Hold successful transactions open to exercise overlapping requests.
      perform pg_sleep(0.15);
      return true;
    end; $$;
    revoke all on function proj_mmd.rate_probe(text, int, int) from public;
    grant execute on function proj_mmd.rate_probe(text, int, int) to anon;
  `);
  docker(['run', '--detach', '--rm', '--pull=never', '--name', rest,
    '--network', `container:${database}`,
    '--env', 'PGRST_DB_URI=postgres://postgres:local-test-only@127.0.0.1:5432/postgres',
    '--env', 'PGRST_DB_SCHEMAS=proj_mmd', '--env', 'PGRST_DB_ANON_ROLE=anon',
    '--env', 'PGRST_DB_POOL=20', 'public.ecr.aws/supabase/postgrest:v16.2']);
  started.push(rest);
  baseUrl = `http://${docker(['port', database, '3000/tcp'])}`;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* Starting up. */ }
    await delay(250);
  }
  throw new Error('The disposable PostgREST container did not become ready');
}, { timeout: 120_000 });

after(() => {
  for (const name of started.reverse()) docker(['rm', '--force', name]);
});

test('invalid keys persist 60 rejected attempts, then receive 429', async () => {
  reset();
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await rpc('intake_applicant', { p_key: 'wrong-key', p_payload: { name: 'Test' } });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, '28000');
  }
  assert.equal(sql("select count(*) from proj_mmd.rate_events where bucket = 'intake-auth'"), '60');
  const limited = await rpc('intake_applicant', { p_key: 'wrong-key', p_payload: {} });
  assert.equal(limited.status, 429);
  assert.equal(limited.body.code, 'PT429');
  assert.equal(limited.body.hint, 'retry_after=600');
  assert.equal(sql('select count(*) from proj_mmd.test_ingestions'), '0');
  assert.equal(sql('select count(*) from proj_mmd.intake_keys where last_used_at is not null'), '0');
});

test('revoked keys are rejected and counted without ingesting a row', async () => {
  reset();
  assert.equal((await rpc('intake_applicant', { p_key: 'revoked-key', p_payload: { name: 'Test' } })).status, 401);
  assert.equal(sql('select count(*) from proj_mmd.rate_events'), '1');
  assert.equal(sql('select count(*) from proj_mmd.test_ingestions'), '0');
});

test('valid single and batch intakes retain their response and partial-batch behavior', async () => {
  reset();
  const single = await rpc('intake_applicant', { p_key: 'valid-key', p_payload: { name: 'Test' } });
  assert.equal(single.status, 200);
  assert.deepEqual(single.body, { accepted: true });
  const batch = await rpc('intake_applicant', { p_key: 'valid-key', p_payload: [{ name: 'Batch' }, {}] });
  assert.equal(batch.status, 200);
  assert.deepEqual(batch.body, { results: [{ accepted: true }, { error: 'missing name' }] });
  assert.equal(sql('select count(*) from proj_mmd.test_ingestions'), '2');
  assert.equal(sql('select count(*) from proj_mmd.intake_keys where last_used_at is not null'), '1');
});

test('concurrent requests cannot exceed a subject cap', async () => {
  reset();
  const responses = await Promise.all(Array.from({ length: 20 }, () =>
    rpc('rate_probe', { p_subject: 'same-person', p_per_subject: 5, p_global: 100 })));
  assert.equal(responses.filter(r => r.status === 200).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 15);
  assert.equal(sql('select count(*) from proj_mmd.rate_events'), '5');
});

test('concurrent requests from different subjects cannot exceed a global cap', async () => {
  reset();
  const responses = await Promise.all(Array.from({ length: 20 }, (_, i) =>
    rpc('rate_probe', { p_subject: `person-${i}`, p_per_subject: 5, p_global: 7 })));
  assert.equal(responses.filter(r => r.status === 200).length, 7);
  assert.equal(responses.filter(r => r.status === 429).length, 13);
  assert.equal(sql('select count(*) from proj_mmd.rate_events'), '7');
});

test('expired events do not block a new request', async () => {
  reset();
  sql("insert into proj_mmd.rate_events values ('test', md5('same-person'), now() - interval '2 days')");
  const response = await rpc('rate_probe', { p_subject: 'same-person', p_per_subject: 1, p_global: 1 });
  assert.equal(response.status, 200);
  assert.equal(sql('select count(*) from proj_mmd.rate_events'), '1');
});

test('the internal limiter remains inaccessible to public API roles', () => {
  const signature = 'proj_mmd._rate_limit(text,integer,interval,integer,interval,text)';
  assert.equal(sql(`select has_function_privilege('anon', '${signature}', 'execute')`), 'f');
  assert.equal(sql(`select has_function_privilege('authenticated', '${signature}', 'execute')`), 'f');
  assert.equal(sql("select relrowsecurity from pg_class where oid = 'proj_mmd.rate_events'::regclass"), 't');
});
