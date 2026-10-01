import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/crm/board-search.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const api = {};
vm.runInNewContext(source, { exports: api });
const item = { title: 'Tuesday schedule', notes: 'Confirm transport\nwith the weekend team.', labels: ['operations'] };

test('keywords are case insensitive, deduplicated, and quoted phrases stay together', () => {
  assert.deepEqual(Array.from(api.searchTerms('  TUESDAY "weekend team" tuesday  ')), ['tuesday', 'weekend team']);
});

test('all words must match, including matches spread across notes and comments', () => {
  assert.ok(api.matchItem(item, ['tuesday', 'transport', 'approved'], ['The manager approved the change.']));
  assert.equal(api.matchItem(item, ['tuesday', 'absent']), null);
});

test('phrases must occur together within one field or comment', () => {
  assert.ok(api.matchItem(item, ['weekend team']));
  assert.equal(api.matchItem(item, ['team approved'], ['approved']), null);
});

test('full notes and old comments are searched, with useful excerpts', () => {
  const match = api.matchItem({ ...item, notes: 'Context. '.repeat(80) + 'Wheelchair transport is booked.' }, ['wheelchair']);
  assert.match(match.excerpt, /Wheelchair/);
  assert.ok(match.excerpt.length < 195);
  assert.ok(api.matchItem(item, ['archive'], ['An archived update from last year.']));
});

test('literal punctuation and wildcard characters do not match unrelated text', () => {
  assert.equal(api.matchItem(item, ['%']), null);
  assert.equal(api.matchItem(item, ['_']), null);
  assert.ok(api.matchItem(item, ['100%'], ['100% complete']));
  assert.ok(api.matchItem(item, ['(approved),'], ['Status (approved), ready']));
});

test('match explanations identify labels, notes and comments', () => {
  const match = api.matchItem(item, ['operations', 'transport', 'approved'], ['Approved by the coordinator.']);
  assert.deepEqual(Array.from(match.sources), ['Notes', 'Labels', 'Comment']);
  assert.match(match.excerpt, /Approved/);
});
