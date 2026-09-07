-- "כתב שנראה קצת אחרת" — schema (applied automatically by Netlify Database on deploy)

create extension if not exists pgcrypto;

-- Meetings: one row per group meeting. Participants link to the meeting open when they started.
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'מפגש',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz not null default now()
);

-- Reflections: exactly one row per anonymous participant (session_id = anonymous client UUID).
create table if not exists teacher_reflections (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null unique,
  meeting_id              uuid references sessions (id) on delete set null,
  answer_1                text not null check (char_length(answer_1) between 1 and 2000),
  answer_2                text not null check (char_length(answer_2) between 1 and 2000),
  answer_3                text not null check (char_length(answer_3) between 1 and 2000),
  learned_letter          text not null default 'א',
  initial_guess           text,
  initial_guess_correct   boolean,
  attempts_identification integer check (attempts_identification is null or attempts_identification between 0 and 500),
  completed_learning      boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists teacher_reflections_meeting_idx on teacher_reflections (meeting_id, created_at desc);
create index if not exists teacher_reflections_created_idx on teacher_reflections (created_at desc);

-- A first open meeting so the app works immediately.
insert into sessions (title)
select 'מפגש ראשון'
where not exists (select 1 from sessions where ended_at is null);
