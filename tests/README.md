Run `npm test` for intake response handling and work-item actions. The action
checks cover permissions, validation, stale edits, and cache refreshes.

Run `npm run test:db` for the PostgreSQL/PostgREST regression checks. Docker must
be running and these images must be available locally:

```sh
docker pull postgres:17-alpine
docker pull public.ecr.aws/supabase/postgrest:v16.2
```

The database suites create disposable containers, use only synthetic data,
bind any HTTP port to loopback, and remove their containers afterward. They do
not read project credentials or connect to a deployed database. The applicant
ingestion fixture records writes; the rate limiter and intake functions come
directly from the migration being tested.

The work-item database suite verifies comment visibility against task RLS,
writer permissions, author identity, text constraints, and deletion behavior.

Deploy `20261001050307_rate_limit_fixes.sql` after the existing hardening
migration to activate the database fixes. The route change and migration are
compatible with either deployment order.

Apply `20261001051910_task_comments.sql` before deploying the work-item comment
interface. Summary and note editing use the existing tasks table.

For browser checks with synthetic data, run `node tests/fixtures/board-api.mjs`.
In a separate checkout or with no other dev server running, start the app in a
fresh PowerShell terminal:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:4319'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='local-test-anon-key'
$env:NEXT_PUBLIC_SUPABASE_SCHEMA='proj_mmd'
npm run dev -- --hostname 127.0.0.1 --port 4320
```

Open `http://127.0.0.1:4319/test-login` to test opening cards, saving details,
posting comments, and reloading. Add `?role=leadership` to check the read-only
view. The fixture is in memory and resets when restarted; it does not replace
the PostgreSQL permission tests. Stop both processes and close the test shell
when finished.
