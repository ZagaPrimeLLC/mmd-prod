import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const container = `mmd-comments-${randomUUID().slice(0, 8)}`;
const task = '00000000-0000-4000-8000-000000000001';
const author = '00000000-0000-4000-8000-000000000002';
let started = false;
function docker(args, input) {
  return execFileSync('docker', args, { input, encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
const sql = text => docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], text);
const asRole = (role, query, user = author) => sql(`begin; set local role authenticated;
  set local request.jwt.claim.sub = '${user}'; set local test.team_role = '${role}'; ${query}; commit;`);

before(async () => {
  docker(['run', '--detach', '--rm', '--pull=never', '--name', container, '--tmpfs', '/var/lib/postgresql/data', '--env', 'POSTGRES_PASSWORD=local-test-only', 'postgres:17-alpine']);
  started = true;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { docker(['exec', container, 'pg_isready', '-U', 'postgres']); ready = true; break; } catch { await delay(250); }
  }
  assert.ok(ready);
  sql(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema proj_mmd;
    grant usage on schema auth, proj_mmd to authenticated, anon;
    create table auth.users (id uuid primary key);
    insert into auth.users values ('${author}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function proj_mmd.has_role(project text, roles text[]) returns boolean language sql stable as $$
      select coalesce(current_setting('test.team_role', true) = any(roles), false) $$;
    create table proj_mmd.tasks (id uuid primary key, visible_to text[]);
    insert into proj_mmd.tasks values ('${task}', array['admin','ops','leadership']);
    alter table proj_mmd.tasks enable row level security;
    grant select on proj_mmd.tasks to authenticated;
    create policy tasks_read on proj_mmd.tasks for select to authenticated using (current_setting('test.team_role', true) = any(visible_to));
  `);
  sql(readFileSync(new URL('../supabase/migrations/20261001051910_task_comments.sql', import.meta.url), 'utf8'));
}, { timeout: 60000 });
after(() => { if (started) docker(['rm', '--force', container]); });

test('ops can post to a visible task and the database records the authenticated author', () => {
  asRole('ops', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', 'First update')`);
  assert.equal(sql('select author_id from proj_mmd.task_comments'), author);
  assert.equal(asRole('ops', 'select count(*) from proj_mmd.task_comments'), '1');
});

test('leadership can read a visible task conversation but cannot add a comment', () => {
  assert.equal(asRole('leadership', 'select count(*) from proj_mmd.task_comments'), '1');
  assert.throws(() => asRole('leadership', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', 'Denied')`));
});

test('a task hidden by task RLS also hides its comments and denies inserts', () => {
  assert.equal(asRole('viewer', 'select count(*) from proj_mmd.task_comments'), '0');
  sql(`update proj_mmd.tasks set visible_to = array['admin','leadership'] where id = '${task}'`);
  assert.equal(asRole('ops', 'select count(*) from proj_mmd.task_comments'), '0');
  assert.throws(() => asRole('ops', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', 'Hidden task')`));
  sql(`update proj_mmd.tasks set visible_to = array['admin','ops','leadership'] where id = '${task}'`);
});

test('callers cannot spoof authors or timestamps, or edit and delete history', () => {
  assert.throws(() => asRole('admin', `insert into proj_mmd.task_comments (task_id, body, author_id) values ('${task}', 'Forged', '${author}')`));
  assert.throws(() => asRole('admin', `insert into proj_mmd.task_comments (task_id, body, created_at) values ('${task}', 'Forged', now())`));
  assert.throws(() => asRole('admin', "update proj_mmd.task_comments set body = 'Rewrite'"));
  assert.throws(() => asRole('admin', 'delete from proj_mmd.task_comments'));
});

test('anonymous users cannot read or insert comments', () => {
  assert.throws(() => sql('set role anon; select * from proj_mmd.task_comments'));
  assert.throws(() => sql(`set role anon; insert into proj_mmd.task_comments (task_id, body) values ('${task}', 'No login')`));
});

test('empty and oversized comments fail at the database boundary', () => {
  assert.throws(() => asRole('ops', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', '   ')`));
  assert.throws(() => asRole('ops', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', E'\\n\\t')`));
  assert.throws(() => asRole('ops', `insert into proj_mmd.task_comments (task_id, body) values ('${task}', repeat('x', 4001))`));
});

test('deleting an account preserves its comments; deleting a task removes only its history', () => {
  sql(`delete from auth.users where id = '${author}'`);
  assert.equal(sql('select count(*) from proj_mmd.task_comments where author_id is null'), '1');
  sql(`delete from proj_mmd.tasks where id = '${task}'`);
  assert.equal(sql('select count(*) from proj_mmd.task_comments'), '0');
});
