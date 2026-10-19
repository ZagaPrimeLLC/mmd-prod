import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { before, after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { loadTs } from './helpers/load-ts.mjs';

const database = `mmd-followup-${randomUUID().slice(0,8)}`;
const actor = '00000000-0000-4000-8000-000000000001';
const board = '00000000-0000-4000-8000-000000000002';
const docker = (args,input) => execFileSync('docker',args,{input,encoding:'utf8',windowsHide:true,timeout:30000,stdio:['pipe','pipe','pipe']}).trim();
const sql = input => docker(['exec','-i',database,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'], input);
const memberSql = input => `set role authenticated; set request.jwt.claim.sub='${actor}'; ${input}`;
const member = input => sql(memberSql(input));
const role = value => sql(`update proj_mmd.team_roles set role='${value}' where user_id='${actor}';`);
const booking = loadTs('src/lib/booking.ts');
let started = false;

before(async () => {
  docker(['run','--detach','--rm','--pull=never','--name',database,'--tmpfs','/var/lib/postgresql/data','--env','POSTGRES_PASSWORD=test-only','postgres:17-alpine']);
  started=true;
  for (let n=0;n<60;n++) { try { docker(['exec',database,'pg_isready','-U','postgres']); break; } catch { await delay(250); } }
  sql(`create role anon nologin; create role authenticated nologin;
    create schema auth; create schema hub; create schema proj_mmd; create schema extensions;
    create extension pgcrypto with schema extensions;
    grant usage on schema auth,hub,proj_mmd to anon,authenticated;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table hub.memberships(user_id uuid,project_slug text);
    create table proj_mmd.team_roles(user_id uuid,role text,job_title text);
    insert into hub.memberships values('${actor}','mmd'); insert into proj_mmd.team_roles values('${actor}','admin',null);
    create function hub.is_member(p text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from hub.memberships where user_id=auth.uid() and project_slug=p)$$;
    create function proj_mmd.has_role(p text,r text[]) returns boolean language sql stable security definer set search_path='' as $$select hub.is_member(p) and exists(select 1 from proj_mmd.team_roles where user_id=auth.uid() and role=any(r))$$;
    create table proj_mmd.inquiries(id uuid primary key default gen_random_uuid(),name text,phone text,email text,service_interested text,message text,source_page text,cta text,status text default 'new',handled_at timestamptz,created_at timestamptz default now());
    create table proj_mmd.bookings(id uuid primary key default gen_random_uuid(),name text,email text,phone text,attribution jsonb,requested_slot timestamptz,status text default 'requested',created_at timestamptz default now());
    create table proj_mmd.applications(id uuid default gen_random_uuid(),applicant_id uuid,job_post_id uuid,created_at timestamptz);
    create table proj_mmd.applicants(id uuid,name text); create table proj_mmd.job_posts(id uuid,title text);
    create table proj_mmd.contacts(id uuid,full_name text,email text,kind text,first_source text);
    create table proj_mmd.newsletter_subscribers(id uuid,email text,created_at timestamptz);
    create table proj_mmd.activity_log(actor_id uuid,verb text,entity_type text,entity_id uuid,meta jsonb);
    create table proj_mmd.profiles(id uuid,display_name text,job_title text);
    create table proj_mmd.boards(id uuid primary key,archived boolean default false);
    insert into proj_mmd.boards values('${board}',false);
    create table proj_mmd.tasks(id uuid primary key default gen_random_uuid(),title text,notes text,owner_id uuid,due_at timestamptz,priority text,stage text,work_type text,created_by uuid,position double precision,linked_type text,linked_id uuid,labels text[],created_at timestamptz default now());
    create table proj_mmd.board_items(board_id uuid references proj_mmd.boards(id),task_id uuid references proj_mmd.tasks(id),position double precision,added_by uuid,primary key(board_id,task_id));
    create table proj_mmd.task_comments(task_id uuid,body text);
    grant select,insert,update,delete on proj_mmd.inquiries,proj_mmd.bookings,proj_mmd.tasks,proj_mmd.board_items,proj_mmd.boards to authenticated;
    grant insert on proj_mmd.bookings to anon;
    alter table proj_mmd.bookings enable row level security;
    create policy public_insert on proj_mmd.bookings for insert to anon,authenticated with check(true);
    create policy member_read on proj_mmd.bookings for select to authenticated using(hub.is_member('mmd'));
    create policy ops_update on proj_mmd.bookings for update to authenticated using(proj_mmd.has_role('mmd',array['admin','ops']));
    do $$declare t text; begin foreach t in array array['inquiries','tasks','board_items','boards'] loop
      execute format('alter table proj_mmd.%I enable row level security',t);
      execute format('create policy ops_access on proj_mmd.%I for all to authenticated using(proj_mmd.has_role(''mmd'',array[''admin'',''ops''])) with check(proj_mmd.has_role(''mmd'',array[''admin'',''ops'']))',t);
    end loop; end $$;
    -- Reproduce Supabase's explicit grants as well as PostgreSQL PUBLIC EXECUTE.
    alter default privileges in schema proj_mmd grant all on tables to anon,authenticated;
    alter default privileges in schema proj_mmd grant all on sequences to anon,authenticated;
    alter default privileges in schema proj_mmd grant execute on functions to anon,authenticated;
  `);
  const dir = new URL('../supabase/migrations/',import.meta.url);
  // Complete analytics/CMS/notifications/inbox chain, without slicing SQL.
  for (const f of readdirSync(dir).filter(f => f >= '20261016210000' && f.endsWith('.sql')).sort()) sql(readFileSync(new URL(f,dir),'utf8'));
}, {timeout:90000});
after(() => { if(started) docker(['rm','--force',database]); });

function schedule(s) {
  sql(`insert into proj_mmd.cms_revisions(id,slot_key,content,status,author_id) values('${actor}','settings.office_hours','${JSON.stringify(s)}','published','${actor}') on conflict(id) do update set content=excluded.content;
    insert into proj_mmd.cms_entries(slot_key,published_revision_id) values('settings.office_hours','${actor}') on conflict(slot_key) do update set published_revision_id=excluded.published_revision_id;`);
}
const insertSlot = iso => sql(`set role anon; insert into proj_mmd.bookings(name,requested_slot) values('Test only','${iso}');`);

test('database holiday calendar agrees with browser for every day in 2026–2030', () => {
  const closed = new Set(JSON.parse(sql(`select json_agg(d::date::text) from generate_series('2026-01-01'::timestamp,'2030-12-31',interval '1 day') d where proj_mmd.office_closed_holiday(d::date);`)));
  for(let d=new Date('2026-01-01T00:00:00Z');d<new Date('2031-01-01');d.setUTCDate(d.getUTCDate()+1)) {
    assert.equal(closed.has(d.toISOString().slice(0,10)),booking.isHoliday({y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}),d.toISOString());
  }
});

test('anonymous booking inserts enforce current hours, closures, notice, horizon and slot alignment', () => {
  const base = booking.DEFAULT_SCHEDULE;
  const day = booking.availableDays(new Date(),base)[0];
  insertSlot(day.slots[0].iso); // First-publication baseline also matches the browser.
  schedule({...base,closed:[day.key]});
  assert.throws(()=>insertSlot(day.slots[0].iso),/no longer available/);
  schedule(base);
  assert.throws(()=>insertSlot(new Date(new Date(day.slots[0].iso).getTime()+60_000).toISOString()),/no longer available/);
  assert.throws(()=>insertSlot(new Date(Date.now()+3600_000).toISOString()),/no longer available/);
  assert.throws(()=>insertSlot(new Date(Date.now()+30*864e5).toISOString()),/no longer available/);
  assert.throws(()=>insertSlot('infinity'),/Choose an available/);
  const allDays={days:[0,1,2,3,4,5,6],start:540,end:1020,closed:[]};
  schedule(allDays);
  for(const d of booking.availableDays(new Date(),allDays)) insertSlot(d.slots[0].iso);
  schedule({...base,days:[]});
  assert.throws(()=>insertSlot(day.slots[0].iso),/no longer available/);
  schedule(base);
});

test('role downgrade hides old lead alerts but preserves unrelated personal notifications', () => {
  sql(`delete from proj_mmd.notifications; insert into proj_mmd.notifications(user_id,kind,title,href) values('${actor}','inquiry','Lead','/dashboard/inbox'),('${actor}','assignment','Work','/dashboard/my-work');`);
  for(const r of ['admin','ops','leadership']) {role(r); assert.equal(member('select count(*) from proj_mmd.notifications;'),'2');}
  role('viewer');
  assert.equal(member('select string_agg(kind,\',\') from proj_mmd.notifications;'),'assignment');
  assert.equal(member("update proj_mmd.notifications set read_at=now() where kind='inquiry' returning id;"),'');
  assert.equal(member("delete from proj_mmd.notifications where kind='inquiry' returning id;"),'');
  sql(`delete from hub.memberships where user_id='${actor}';`);
  assert.equal(member('select count(*) from proj_mmd.notifications;'),'0');
  sql(`insert into hub.memberships values('${actor}','mmd');`);role('admin');
});

test('Supabase-style default grants do not expose internal functions or CMS editorial rows', () => {
  const functions=['rollup_web','purge_web','web_allowed_props','notify_members','notify_one','purge_notifications','office_closed_holiday','enforce_booking_schedule'];
  for(const r of ['anon','authenticated']) {
    assert.equal(sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='proj_mmd' and p.proname in (${functions.map(f=>`'${f}'`).join(',')}) and has_function_privilege('${r}',p.oid,'execute');`),'0');
  }
  assert.throws(()=>sql('set role anon; select * from proj_mmd.cms_revisions;'),/permission denied/);
  assert.throws(()=>sql(`set role anon; select proj_mmd.inquiry_to_task('${actor}','${board}');`),/permission denied/);
});

test('CMS edits and publishing distinguish viewer, operations and administrator', () => {
  role('viewer');
  assert.throws(()=>member(`insert into proj_mmd.cms_revisions(slot_key,content,author_id) values('home.hero.badge','{"text":"Test"}','${actor}');`),/row-level security/);
  role('ops');
  const id=member(`insert into proj_mmd.cms_revisions(slot_key,content,author_id) values('home.hero.badge','{"text":"Test"}','${actor}') returning id;`);
  assert.throws(()=>member(`update proj_mmd.cms_revisions set content='{}' where id='${id}';`),/permission denied/);
  assert.throws(()=>member(`select proj_mmd.cms_publish('${id}');`),/Only an administrator/);
  role('admin'); member(`select proj_mmd.cms_publish('${id}');`);
  assert.deepEqual(JSON.parse(sql("set role anon; select proj_mmd.cms_published_content('home.hero.badge');")),{text:'Test'});
});

test('work-card conversion is role checked, atomic and safe under concurrent requests', async () => {
  const id=sql("insert into proj_mmd.inquiries(name,message) values('Test only','Follow up') returning id;");
  role('viewer'); assert.throws(()=>member(`select proj_mmd.inquiry_to_task('${id}','${board}');`),/cannot create work cards/);
  role('ops');
  const run=promisify(execFile);
  await Promise.all([0,1].map(()=>run('docker',['exec',database,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-Atq','-c',memberSql(`begin; select proj_mmd.inquiry_to_task('${id}','${board}'); select pg_sleep(0.15); commit;`)],{windowsHide:true})));
  assert.equal(sql(`select count(*) from proj_mmd.tasks where linked_id='${id}';`),'1');
  assert.equal(sql(`select count(*) from proj_mmd.board_items b join proj_mmd.tasks t on t.id=b.task_id where t.linked_id='${id}';`),'1');
  const failed=sql("insert into proj_mmd.inquiries(name) values('Rollback only') returning id;");
  sql(`create function proj_mmd.test_reject_link() returns trigger language plpgsql as $$begin raise exception 'test link failure'; end$$;
    create trigger test_reject_link before insert on proj_mmd.board_items for each row execute function proj_mmd.test_reject_link();`);
  assert.throws(()=>member(`select proj_mmd.inquiry_to_task('${failed}','${board}');`),/test link failure/);
  assert.equal(sql(`select count(*) from proj_mmd.tasks where linked_id='${failed}';`),'0');
  assert.equal(sql(`select status from proj_mmd.inquiries where id='${failed}';`),'new');
  sql('drop trigger test_reject_link on proj_mmd.board_items;');
  role('admin');
});

test('follow-up migrations support the atomic remote wrapper and safe reapplication, in order', () => {
  for (const name of ['20261017114637_followup_review_fixes', '20261017160000_followup_round2']) {
    const migration=readFileSync(new URL(`../supabase/migrations/${name}.sql`,import.meta.url),'utf8');
    sql(`do $followup$ begin\n${migration.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'')}\nend $followup$;`);
  }
  assert.equal(sql("select count(*) from pg_trigger where tgname='a_validate_booking_schedule';"),'0');
  assert.equal(sql("select count(*) from pg_trigger where tgname='validate_booking_schedule';"),'1');
});

test('the booking check binds website and app roles only; administrators can still correct or restore a booking', () => {
  const past = new Date(Date.now() - 864e5).toISOString();
  assert.throws(()=>insertSlot(past),/no longer available/);
  assert.throws(()=>sql(`set role authenticated; insert into proj_mmd.bookings(name,requested_slot) values('Test only','${past}');`),/no longer available/);
  const id = sql(`insert into proj_mmd.bookings(name,requested_slot) values('Restored row','${past}') returning id;`);
  assert.match(id, /^[0-9a-f-]{36}$/);
  sql(`update proj_mmd.bookings set requested_slot = requested_slot + interval '1 hour' where id='${id}';`);
  sql(`delete from proj_mmd.bookings where id='${id}';`);
});

test('booking rule violations use dedicated error codes', () => {
  const verbose = q => sql(`\\set VERBOSITY verbose\n${q}`);
  assert.throws(()=>verbose(`set role anon; insert into proj_mmd.bookings(name,requested_slot) values('Test only','${new Date(Date.now()+3600_000).toISOString()}');`),/MB001/);
  sql(`insert into proj_mmd.cms_entries(slot_key,published_revision_id) values('settings.office_hours','${actor}') on conflict(slot_key) do nothing;
    update proj_mmd.cms_revisions set status='archived' where id='${actor}';`);
  assert.throws(()=>verbose(`set role anon; insert into proj_mmd.bookings(name,requested_slot) values('Test only','${new Date(Date.now()+3*864e5).toISOString()}');`),/MB002/);
  sql(`update proj_mmd.cms_revisions set status='published' where id='${actor}';`);
});

test('the booking check shares its lock with other bookings and yields to a schedule publish', () => {
  const src = sql("select pg_get_functiondef('proj_mmd.enforce_booking_schedule()'::regprocedure);");
  assert.match(src, /pg_advisory_xact_lock_shared\(hashtext\('cms_publish:settings\.office_hours'\)\)/);
  const order = sql("select string_agg(tgname, ',' order by tgname) from pg_trigger where tgrelid='proj_mmd.bookings'::regclass and not tgisinternal and tgname in ('limit_public_insert','validate_booking_schedule');");
  if (order.includes('limit_public_insert')) assert.equal(order, 'limit_public_insert,validate_booking_schedule');
});

test('old applicant, contact and newsletter alerts follow the roles they are sent to', () => {
  sql(`delete from proj_mmd.notifications; insert into proj_mmd.notifications(user_id,kind,title,href) values
    ('${actor}','application','Applicant','/dashboard/recruitment'),('${actor}','contact','Contact','/dashboard/contacts'),
    ('${actor}','newsletter','Signup','/dashboard/contacts'),('${actor}','review','Review','/dashboard/content'),
    ('${actor}','inquiry','Lead','/dashboard/inbox'),('${actor}','assignment','Work','/dashboard/my-work');`);
  const kinds = () => member("select coalesce(string_agg(kind, ',' order by kind), '') from proj_mmd.notifications;");
  role('admin');      assert.equal(kinds(), 'application,assignment,contact,inquiry,newsletter,review');
  role('ops');        assert.equal(kinds(), 'application,assignment,contact,inquiry,newsletter');
  role('leadership'); assert.equal(kinds(), 'assignment,inquiry');
  role('viewer');     assert.equal(kinds(), 'assignment');
  assert.equal(member("update proj_mmd.notifications set read_at=now() where kind='application' returning id;"),'');
  role('admin');
});


test('home-care booking column, legacy clients and notification labels work with real database rules', () => {
  sql(readFileSync(new URL('./home-care-bookings-db.sql', import.meta.url), 'utf8'));
});
