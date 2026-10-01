Run `npm test` for the intake route regression checks. They exercise the actual
route and Supabase response parser with a controlled HTTP transport.

Run `npm run test:db` for the PostgreSQL/PostgREST regression checks. Docker must
be running and these images must be available locally:

```sh
docker pull postgres:17-alpine
docker pull public.ecr.aws/supabase/postgrest:v16.2
```

The database suite creates two disposable containers, uses only synthetic data,
binds its HTTP port to loopback, and removes both containers afterward. It does
not read project credentials or connect to a deployed database. The applicant
ingestion fixture records writes; the rate limiter and intake functions come
directly from the migration being tested.

Deploy `20261001050307_rate_limit_fixes.sql` after the existing hardening
migration to activate the database fixes. The route change and migration are
compatible with either deployment order.
