// Local browser fixture only. No real credentials, users, or remote services.
// Start this file, point a separate dev server at http://127.0.0.1:4319, and
// open /test-login on this fixture to sign into the synthetic board on port 4320.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const userId = '00000000-0000-4000-8000-000000000002';
const taskId = '00000000-0000-4000-8000-000000000001';
const boardId = '00000000-0000-4000-8000-000000000003';
const task = {
  id: taskId, title: 'Review the Tuesday schedule', notes: 'Confirm coverage with the team.\nRecord any changes here.',
  stage: 'todo', work_type: 'task', priority: 'high', position: 1000, labels: ['operations'],
  owner_id: userId, due_at: null, completed_at: null,
  created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z',
};
const board = { id: boardId, key: 'operations', name: 'Operations', description: 'Local browser test', visible_to: ['ops','leadership'], position: 10, archived: false };
const tasks = [task, {
  ...task, id: '00000000-0000-4000-8000-000000000004', title: 'Arrange the community visit', stage: 'in_progress', position: 2000,
  notes: 'Review the plan with the coordinator. '.repeat(12) + 'Wheelchair transport is booked for Friday.',
}, {
  ...task, id: '00000000-0000-4000-8000-000000000005', title: 'Complete office inventory', stage: 'done', position: 3000,
  notes: 'Supplies restocked. The cabinet is 100% ready.',
}];
const comments = [{ id: randomUUID(), task_id: taskId, author_id: userId, body: 'The initial schedule is ready for review.', created_at: '2026-10-01T11:00:00Z' },
  ...Array.from({ length: 51 }, (_, index) => ({ id: randomUUID(), task_id: tasks[1].id, author_id: userId, body: `Progress update ${index + 1}.`, created_at: '2026-10-01T11:00:00Z' })),
  { id: randomUUID(), task_id: tasks[1].id, author_id: userId, body: 'The coordinator approved the accessible shuttle.', created_at: '2026-09-01T11:00:00Z' },
];
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-01T00:00:00Z' };
const profile = { id: userId, display_name: 'Test Operator', avatar_url: null, job_title: 'Operations' };
const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function session(role) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  return { access_token: `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: userId, role: 'authenticated', app_role: role, exp: expires })}.local-fixture`,
    refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: expires, user };
}
function roleOf(request) {
  try { return JSON.parse(Buffer.from(request.headers.authorization.split('.')[1], 'base64url').toString()).app_role; } catch { return null; }
}
function matches(row, query) {
  for (const [key, value] of query) {
    if (value.startsWith('eq.') && String(row[key]) !== value.slice(3)) return false;
    if (value === 'is.null' && row[key] !== null) return false;
    if (value.startsWith('in.(') && !value.slice(4, -1).split(',').includes(String(row[key]))) return false;
  }
  return true;
}

createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4319');
  const send = (body, status = 200, headers = {}) => {
    response.writeHead(status, { 'content-type': 'application/json', ...headers });
    response.end(JSON.stringify(body));
  };
  if (url.pathname === '/test-login') {
    const cookie = `base64-${encoded(session(url.searchParams.get('role') || 'ops'))}`;
    response.writeHead(302, { 'set-cookie': `sb-127-auth-token=${cookie}; Path=/; SameSite=Lax`, location: 'http://127.0.0.1:4320/dashboard/board' });
    response.end(); return;
  }
  if (url.pathname === '/auth/v1/user') { send(user); return; }
  if (url.pathname === '/rest/v1/rpc/mmd_role') { send(roleOf(request)); return; }
  if (!url.pathname.startsWith('/rest/v1/')) { send({ error: 'Unknown fixture endpoint' }, 404); return; }
  const table = url.pathname.slice('/rest/v1/'.length);
  let raw = '';
  for await (const chunk of request) raw += chunk;
  const payload = raw ? JSON.parse(raw) : null;
  let rows = [];
  if (table === 'profiles') rows = [profile];
  if (table === 'boards') rows = [board];
  if (table === 'tasks') {
    rows = tasks.filter(row => matches(row, url.searchParams));
    if (request.method === 'PATCH') {
      if (roleOf(request) !== 'ops') { send({ message: 'Denied' }, 403); return; }
      for (const row of rows) Object.assign(row, payload);
    }
  }
  if (table === 'board_items') rows = tasks.map(item => ({ task_id: item.id, board_id: boardId, position: item.position, tasks: item, boards: board }));
  if (table === 'task_comments') {
    if (request.method === 'POST') {
      if (roleOf(request) !== 'ops') { send({ message: 'Denied' }, 403); return; }
      comments.unshift({ ...payload, id: randomUUID(), author_id: userId, created_at: new Date().toISOString() });
      response.writeHead(201); response.end(); return;
    }
    rows = comments;
  }
  // UPDATE ... RETURNING returns the matched rows even when the update changes
  // a column used by its original-value filter.
  if (!(table === 'tasks' && request.method === 'PATCH')) rows = rows.filter(row => matches(row, url.searchParams));
  const total = rows.length;
  const offset = Number(url.searchParams.get('offset') || 0);
  const limit = Number(url.searchParams.get('limit') || 1000);
  rows = rows.slice(offset, offset + limit);
  const body = request.headers.accept?.includes('vnd.pgrst.object') ? rows[0] ?? null : rows;
  send(body, 200, { 'content-range': `${offset}-${offset + rows.length - 1}/${total}` });
}).listen(4319, '127.0.0.1', () => console.log('Synthetic board API ready at http://127.0.0.1:4319/test-login'));
