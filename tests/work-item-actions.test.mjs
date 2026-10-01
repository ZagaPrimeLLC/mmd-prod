import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const id = '00000000-0000-4000-8000-000000000001';
const source = ts.transpileModule(readFileSync(new URL('../src/app/(dashboard)/dashboard/board/actions.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ role = 'ops', signedIn = true, row = { id, title: 'Original', notes: null, stage: 'done', owner_id: 'someone' }, denied = false } = {}) {
  const calls = [], paths = [], exports = {};
  const db = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'author' } : null } }) },
    rpc: async () => ({ data: role }),
    from(table) {
      calls.push({ table });
      let patch;
      const filters = [];
      const query = {
        update(value) { patch = value; return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        is(key, value) { filters.push([key, value]); return query; },
        select() { return query; },
        async maybeSingle() {
          if (denied) return { data: null, error: { message: 'Permission denied' } };
          if (!row || !filters.every(([key, value]) => row[key] === value)) return { data: null, error: null };
          Object.assign(row, patch);
          return { data: { id }, error: null };
        },
        async insert(value) { calls.push({ inserted: value }); return { error: denied ? { message: 'denied' } : null }; },
      };
      return query;
    },
  };
  vm.runInNewContext(source, { exports, Date, require(name) {
    if (name === 'next/cache') return { revalidatePath: path => paths.push(path) };
    if (name === '@/lib/supabase/server') return { createClient: async () => db };
    if (name === '@/lib/crm/board') return { STAGE_KEYS: [] };
    throw new Error(name);
  } });
  return { ...exports, row, calls, paths };
}

const form = fields => { const value = new FormData(); for (const [key, text] of Object.entries(fields)) value.set(key, text); return value; };
const original = { title: 'Original', notes: null };

test('saving details preserves stage and assignment, and refreshes every task surface', async () => {
  const api = setup();
  assert.equal((await api.saveItemDetails(id, original, form({ title: '  Revised summary  ', notes: 'First line\nSecond line' }))).ok, true);
  assert.equal(api.row.title, 'Revised summary');
  assert.equal(api.row.notes, 'First line\nSecond line');
  assert.equal(api.row.stage, 'done');
  assert.equal(api.row.owner_id, 'someone');
  assert.deepEqual(api.paths, ['/dashboard/board', '/dashboard', '/dashboard/my-work', `/dashboard/board/${id}`]);
});

test('stale notes cannot overwrite a teammate update', async () => {
  const api = setup({ row: { id, title: 'Original', notes: 'Teammate update' } });
  const result = await api.saveItemDetails(id, original, form({ title: 'New', notes: 'Stale overwrite' }));
  assert.equal(result.ok, false);
  assert.match(result.error, /changed/);
  assert.equal(api.row.notes, 'Teammate update');
  assert.equal(api.paths.length, 0);
});

test('notes can be cleared and blank summaries cannot be saved', async () => {
  const api = setup({ row: { id, title: 'Original', notes: 'Old notes' } });
  assert.equal((await api.saveItemDetails(id, { title: 'Original', notes: 'Old notes' }, form({ title: 'Original', notes: '  ' }))).ok, true);
  assert.equal(api.row.notes, null);
  assert.equal((await api.saveItemDetails(id, original, form({ title: ' ', notes: '' }))).ok, false);
});

for (const role of ['leadership', 'viewer', null]) {
  test(`${role ?? 'non-member'} cannot edit or comment even when calling actions directly`, async () => {
    const api = setup({ role });
    assert.equal((await api.saveItemDetails(id, original, form({ title: 'New' }))).ok, false);
    assert.equal((await api.addItemComment(id, form({ body: 'Update' }))).ok, false);
    assert.equal(api.calls.length, 0);
  });
}

test('signed-out requests cannot edit or comment', async () => {
  const api = setup({ signedIn: false });
  assert.equal((await api.saveItemDetails(id, original, form({ title: 'New' }))).ok, false);
  assert.equal((await api.addItemComment(id, form({ body: 'Update' }))).ok, false);
  assert.equal(api.calls.length, 0);
});

test('comments send only task and text, leaving author identity to the database', async () => {
  const api = setup();
  const result = await api.addItemComment(id, form({ body: '  Progress\nNext step  ', author_id: 'forged', created_at: '2000-01-01' }));
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(api.calls[1].inserted)), { task_id: id, body: 'Progress\nNext step' });
  assert.ok(api.paths.includes(`/dashboard/board/${id}`));
});

test('invalid IDs and empty or oversized text fail before any database write', async () => {
  const api = setup();
  for (const body of ['', '   ', 'x'.repeat(4001)]) assert.equal((await api.addItemComment(id, form({ body }))).ok, false);
  assert.equal((await api.addItemComment('missing', form({ body: 'Update' }))).ok, false);
  assert.equal((await api.saveItemDetails(id, original, form({ title: 'x'.repeat(201) }))).ok, false);
  assert.equal((await api.saveItemDetails(id, original, form({ title: 'Valid', notes: 'x'.repeat(4001) }))).ok, false);
  assert.equal(api.calls.length, 0);
});

test('database denial is not reported as a successful save or comment', async () => {
  const api = setup({ denied: true });
  assert.equal((await api.saveItemDetails(id, original, form({ title: 'New' }))).ok, false);
  assert.equal((await api.addItemComment(id, form({ body: 'Update' }))).ok, false);
  assert.equal(api.paths.length, 0);
});
