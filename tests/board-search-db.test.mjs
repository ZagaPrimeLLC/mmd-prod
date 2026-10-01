import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

const suffix = randomUUID().slice(0, 8);
const database = `mmd-search-db-${suffix}`, rest = `mmd-search-rest-${suffix}`;
const started = [];
const board = '00000000-0000-4000-8000-000000000001';
const otherBoard = '00000000-0000-4000-8000-000000000002';
const hiddenBoard = '00000000-0000-4000-8000-000000000003';
const task = '00000000-0000-4000-8001-000000000001';
let db, session, GET;
function docker(args, input) {
  return execFileSync('docker', args, { input, encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
const sql = text => docker(['exec', '-i', database, 'psql', '-X', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], text);
function compile(file, imports = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, URL, Response, require(name) {
    if (name in imports) return imports[name];
    throw new Error(`Unexpected import: ${name}`);
  } });
  return exports;
}
async function search(q, boardId = board) {
  const response = await GET(new Request(`http://localhost/api/board-search?${new URLSearchParams({ q, board: boardId })}`));
  return { status: response.status, cache: response.headers.get('cache-control'), body: await response.json() };
}

before(async () => {
  docker(['run', '--detach', '--rm', '--pull=never', '--name', database, '--tmpfs', '/var/lib/postgresql/data',
    '--publish', '127.0.0.1::3000', '--env', 'POSTGRES_PASSWORD=local-test-only', 'postgres:17-alpine']);
  started.push(database);
  for (let i = 0; i < 60; i++) {
    try { docker(['exec', database, 'pg_isready', '-U', 'postgres']); break; } catch { await delay(250); }
  }
  sql(`
    create role board_reader nologin;
    create schema proj_mmd;
    grant usage on schema proj_mmd to board_reader;
    create table proj_mmd.boards (id uuid primary key, archived boolean default false, visible boolean default true);
    create table proj_mmd.tasks (id uuid primary key, title text, notes text, labels text[] default '{}', visible boolean default true);
    create table proj_mmd.board_items (task_id uuid references proj_mmd.tasks, board_id uuid references proj_mmd.boards, position int default 1000, primary key(task_id, board_id));
    create table proj_mmd.task_comments (id uuid primary key default gen_random_uuid(), task_id uuid references proj_mmd.tasks, body text);
    grant select on all tables in schema proj_mmd to board_reader;
    alter table proj_mmd.boards enable row level security;
    alter table proj_mmd.tasks enable row level security;
    alter table proj_mmd.board_items enable row level security;
    alter table proj_mmd.task_comments enable row level security;
    create policy boards_read on proj_mmd.boards for select to board_reader using (visible);
    create policy tasks_read on proj_mmd.tasks for select to board_reader using (visible);
    create policy links_read on proj_mmd.board_items for select to board_reader using (exists(select 1 from proj_mmd.boards b where b.id = board_id));
    create policy comments_read on proj_mmd.task_comments for select to board_reader using (exists(select 1 from proj_mmd.tasks t where t.id = task_id));
    insert into proj_mmd.boards(id, visible) values ('${board}',true),('${otherBoard}',true),('${hiddenBoard}',false);
    insert into proj_mmd.tasks(id,title,notes,labels) values ('${task}','Tuesday schedule','Confirm wheelchair transport',array['operations']);
    insert into proj_mmd.board_items(task_id,board_id) values ('${task}','${board}');
    insert into proj_mmd.task_comments(task_id,body) values ('${task}','The coordinator approved the change.');
    insert into proj_mmd.tasks(id,title,visible) values
      ('00000000-0000-4000-8001-000000000002','Secret task',false),
      ('00000000-0000-4000-8001-000000000003','Other board task',true);
    insert into proj_mmd.board_items(task_id,board_id) values
      ('00000000-0000-4000-8001-000000000002','${board}'),
      ('00000000-0000-4000-8001-000000000003','${otherBoard}');
    insert into proj_mmd.task_comments(task_id,body) values
      ('00000000-0000-4000-8001-000000000002','Classified comment'),
      ('00000000-0000-4000-8001-000000000003','Different conversation');
  `);
  docker(['run', '--detach', '--rm', '--pull=never', '--name', rest, '--network', `container:${database}`,
    '--env', 'PGRST_DB_URI=postgres://postgres:local-test-only@127.0.0.1:5432/postgres',
    '--env', 'PGRST_DB_SCHEMAS=proj_mmd', '--env', 'PGRST_DB_ANON_ROLE=board_reader',
    '--env', 'PGRST_DB_MAX_ROWS=1000', 'public.ecr.aws/supabase/postgrest:v16.2']);
  started.push(rest);
  const url = `http://${docker(['port', database, '3000/tcp'])}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Starting. */ }
    await delay(250);
  }
  db = createClient(url, 'local-test-key', { db: { schema: 'proj_mmd' }, global: {
    // Supabase normally prefixes /rest/v1; this isolated PostgREST listens at /.
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.delete('authorization'); // The disposable API uses board_reader as its test role.
      return fetch(String(input).replace('/rest/v1/', '/'), { ...init, headers });
    },
  }, auth: { persistSession: false, autoRefreshToken: false } });
  session = { supabase: db, user: { id: 'test-user' }, role: 'ops', failed: null };
  ({ GET } = compile('../src/app/api/board-search/route.ts', {
    '@/lib/crm/session': { getSession: async () => session },
    '@/lib/crm/board-data': compile('../src/lib/crm/board-data.ts'),
    '@/lib/crm/board-search': compile('../src/lib/crm/board-search.ts'),
  }));
}, { timeout: 120000 });

after(() => { for (const name of started.reverse()) docker(['rm', '--force', name]); });

test('deep search combines summary, notes, labels and comments', async () => {
  const result = await search('TUESDAY wheelchair operations approved');
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.deepEqual(Object.keys(result.body.matches), [task]);
  assert.deepEqual(result.body.matches[task].sources, ['Summary', 'Notes', 'Labels', 'Comment']);
  assert.match(result.cache, /no-store/);
  assert.equal(Object.keys((await search('tuesday impossible')).body.matches).length, 0);
});

test('punctuation, quotes, wildcard characters and backslashes are literal search text', async () => {
  const strings = ['100% complete', 'file_name', 'name,(test)', 'say "yes"', 'C:\\care', 'star*value'];
  for (const value of strings) {
    sql(`insert into proj_mmd.task_comments(task_id,body) values ('${task}', '${value.replaceAll("'", "''")}');`);
    const result = await search(value);
    assert.equal(result.status, 200);
    assert.equal(result.body.warning, undefined, JSON.stringify(result.body));
    assert.ok(result.body.matches[task], value);
  }
  assert.equal(Object.keys((await search('zzz*missing')).body.matches).length, 0);
  const injection = await search('x"),task_id.not.is.null,body.ilike."%');
  assert.equal(Object.keys(injection.body.matches).length, 0);
  assert.equal(injection.body.warning, undefined);
});

test('board scope and database row policies exclude inaccessible items and comments', async () => {
  for (const word of ['secret', 'classified', 'different']) assert.deepEqual((await search(word)).body.matches, {});
  assert.equal((await search('anything', hiddenBoard)).status, 404);
  assert.equal(Object.keys((await search('different', otherBoard)).body.matches).length, 1);
});

test('signed-out and nonmember requests are rejected; read-only members can search', async () => {
  const original = session;
  try {
    session = { ...original, user: null }; assert.equal((await search('tuesday')).status, 401);
    session = { ...original, role: null }; assert.equal((await search('tuesday')).status, 403);
    session = { ...original, role: 'leadership' }; assert.ok((await search('tuesday')).body.matches[task]);
  } finally { session = original; }
});

test('validation rejects excessive search input and malformed board IDs', async () => {
  assert.equal((await search('a'.repeat(201))).status, 400);
  assert.equal((await search('a b c d e f g h i')).status, 400);
  assert.equal((await search('tuesday', 'invalid')).status, 400);
});

test('search reaches cards and comment matches beyond the default API row limit', async () => {
  sql(`
    insert into proj_mmd.tasks(id,title) select ('10000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid, 'Archive card ' || i from generate_series(1,1005) i;
    insert into proj_mmd.board_items(task_id,board_id) select id,'${board}' from proj_mmd.tasks where title like 'Archive card%';
    insert into proj_mmd.task_comments(id,task_id,body) select
      ('20000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,'${task}',
      case when i=1005 then 'meeting finalapproval' else 'meeting update' end from generate_series(1,1005) i;
  `);
  assert.equal(Object.keys((await search('archive')).body.matches).length, 1005);
  assert.ok((await search('meeting finalapproval')).body.matches[task]);
});

test('unavailable comments report partial coverage while notes remain searchable', async () => {
  sql('revoke select on proj_mmd.task_comments from board_reader');
  try {
    const result = await search('wheelchair');
    assert.ok(result.body.matches[task]);
    assert.match(result.body.warning, /Comments could not be searched/);
  } finally { sql('grant select on proj_mmd.task_comments to board_reader'); }
});
