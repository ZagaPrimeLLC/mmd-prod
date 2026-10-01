-- A "Blocked" column on the work board: stuck work, waiting on someone or something.
alter table proj_mmd.tasks drop constraint if exists tasks_stage_check;
alter table proj_mmd.tasks add constraint tasks_stage_check
  check (stage in ('backlog', 'todo', 'in_progress', 'blocked', 'review', 'done'));
