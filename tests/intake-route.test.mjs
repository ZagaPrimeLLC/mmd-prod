import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = ts.transpileModule(
  readFileSync(new URL('../src/app/api/intake/route.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText;

// Execute the actual route and Supabase response parser with a controlled HTTP transport.
function routeFor(status, body) {
  const calls = [];
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    process: { env: {} },
    require(name) {
      if (name !== '@supabase/supabase-js') return require(name);
      return {
        createClient(_url, _key, options) {
          return createClient('http://supabase.test', 'test-anon-key', {
            ...options,
            global: {
              fetch: async (url, init) => {
                calls.push({ url, init });
                return Response.json(body, { status });
              },
            },
          });
        },
      };
    },
  });
  return { ...exports, calls };
}

function request(body = { name: 'Test applicant', email: 'test@example.invalid' }, key = 'test-key') {
  return new Request('http://localhost/api/intake', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
  });
}

for (const seconds of [600, 3600]) {
  test(`throttled intake returns 429 and Retry-After ${seconds}`, async () => {
    const route = routeFor(429, { code: 'PT429', message: 'Too many requests.', hint: `retry_after=${seconds}` });
    const response = await route.POST(request());
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), String(seconds));
    assert.deepEqual(await response.json(), { error: 'Too many requests.' });
  });
}

for (const hint of [null, '', 'retry_after=0', 'retry_after=-1', 'retry_after=NaN', 'retry_after=9999999999999999999999', 'retry_after=60\r\nX-Test: bad']) {
  test(`throttle with invalid hint ${JSON.stringify(hint)} uses a safe retry delay`, async () => {
    const route = routeFor(429, { code: 'PT429', message: 'Too many requests.', hint });
    const response = await route.POST(request());
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '3600');
  });
}

test('committed database rejection still returns 401 through the Supabase client', async () => {
  const route = routeFor(401, { code: '28000', message: 'invalid intake key', details: null, hint: null });
  const response = await route.POST(request());
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Invalid or revoked key.' });
});

test('valid intake keeps its successful response and forwards the payload', async () => {
  const result = { applicant_id: 'test-applicant', new_applicant: true };
  const route = routeFor(200, result);
  const response = await route.POST(request());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, result });
  assert.equal(route.calls.length, 1);
  assert.deepEqual(JSON.parse(route.calls[0].init.body), {
    p_key: 'test-key', p_payload: { name: 'Test applicant', email: 'test@example.invalid' },
  });
});

test('validation errors remain 422, without a retry header', async () => {
  const route = routeFor(400, { code: 'P0001', message: 'missing name' });
  const response = await route.POST(request());
  assert.equal(response.status, 422);
  assert.equal(response.headers.get('retry-after'), null);
});

test('missing keys are rejected before calling the database', async () => {
  const route = routeFor(200, {});
  assert.equal((await route.POST(request({}, ''))).status, 401);
  assert.equal(route.calls.length, 0);
});
