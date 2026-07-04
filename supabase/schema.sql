-- ═══════════════════════════════════════════════════════════════════════════
-- Goodness Dialogs Game - Supabase setup
--
-- HOW TO RUN: Supabase dashboard → your project → SQL Editor → New query →
-- paste this whole file → Run. Safe to re-run any time (it upgrades in place).
-- ═══════════════════════════════════════════════════════════════════════════

-- One row per child who fills the "about you" form.
-- The id is generated in the browser so the game never needs to read back.
create table if not exists public.students (
  id         uuid primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  age        int,
  city       text,
  country    text
);

-- One row per interaction while playing.
-- event_type: game_start | thought | choice_1 | choice_2 | story_skipped |
--             try_differently | reflection | reflection_skipped |
--             episode_complete
-- data: the details (moment, choice letter, choice text, score, virtue, ...)
-- session_id groups one full playthrough; student_id links to students.
-- (student_id is intentionally NOT a foreign key so an event can never be
-- lost just because the student insert failed on a flaky connection.)
create table if not exists public.game_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  student_id uuid,
  session_id uuid not null,
  episode    int,
  event_type text not null,
  data       jsonb not null default '{}'::jsonb
);

create index if not exists game_events_student_idx on public.game_events (student_id);
create index if not exists game_events_session_idx on public.game_events (session_id);
create index if not exists game_events_type_idx    on public.game_events (event_type);
create index if not exists game_events_created_idx on public.game_events (created_at);
create index if not exists students_created_idx    on public.students (created_at);

-- ── Security: the browser (anon key) can only INSERT, never read/edit ─────
alter table public.students    enable row level security;
alter table public.game_events enable row level security;

-- Inserts must look like real form answers (length/range limits keep out
-- garbage and megabyte-sized payloads).
drop policy if exists "game can insert students" on public.students;
create policy "game can insert students"
  on public.students for insert to anon
  with check (
    char_length(name) between 1 and 60
    and (age is null or age between 3 and 99)
    and (city is null or char_length(city) <= 60)
    and (country is null or char_length(country) <= 60)
  );

-- Events must use a known event type and stay small.
drop policy if exists "game can insert events" on public.game_events;
create policy "game can insert events"
  on public.game_events for insert to anon
  with check (
    event_type in (
      'game_start', 'thought', 'choice_1', 'choice_2', 'story_skipped',
      'try_differently', 'reflection', 'reflection_skipped',
      'episode_complete'
    )
    and pg_column_size(data) <= 4096
  );

-- ── Anti-spam rate limits (enforced in the database, can't be bypassed) ───
-- A real playthrough writes ~50 events, so these caps never touch students
-- but stop anyone trying to flood the tables with the public key.

create or replace function public.students_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- At most 1000 new students per hour across the whole game.
  if (select count(*) from public.students
       where created_at > now() - interval '1 hour') >= 1000 then
    raise exception 'rate limit: too many new students right now';
  end if;
  return new;
end;
$$;

drop trigger if exists students_guard_trg on public.students;
create trigger students_guard_trg
  before insert on public.students
  for each row execute function public.students_guard();

create or replace function public.game_events_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- One playthrough (session) can never write more than 500 events...
  if (select count(*) from public.game_events
       where session_id = new.session_id) >= 500 then
    raise exception 'rate limit: session event cap reached';
  end if;
  -- ...and the whole game tops out at 20k events/hour (≈400 playthroughs).
  if (select count(*) from public.game_events
       where created_at > now() - interval '1 hour') >= 20000 then
    raise exception 'rate limit: too many events right now';
  end if;
  return new;
end;
$$;

drop trigger if exists game_events_guard_trg on public.game_events;
create trigger game_events_guard_trg
  before insert on public.game_events
  for each row execute function public.game_events_guard();

-- ── Admin access: ONLY the admin account may read the data ────────────────
-- Used by admin.html (the admin panel). Pinned to the admin email so that
-- no other signed-in account can ever read student data.

drop policy if exists "admin can read students" on public.students;
create policy "admin can read students"
  on public.students for select to authenticated
  using ((auth.jwt() ->> 'email') = 'gamegoodnessinc@gmail.com');

drop policy if exists "admin can read events" on public.game_events;
create policy "admin can read events"
  on public.game_events for select to authenticated
  using ((auth.jwt() ->> 'email') = 'gamegoodnessinc@gmail.com');


-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN QUERIES - copy any of these into the SQL Editor to analyze the data.
-- (You can also browse both tables in Table Editor, and export CSV from
--  the query results.)
-- ═══════════════════════════════════════════════════════════════════════════

-- Every student and their final score, newest first:
--   select s.name, s.age, s.city, s.country,
--          e.created_at as finished_at,
--          (e.data->>'score')::int as final_score,
--          e.data->'virtues' as virtues
--     from public.game_events e
--     join public.students s on s.id = e.student_id
--    where e.event_type = 'episode_complete'
--    order by e.created_at desc;

-- Which choice did students pick at each moment (A vs B, first choice):
--   select (data->>'moment')::int as moment,
--          data->>'title' as title,
--          data->>'choice' as choice,
--          count(*) as picks
--     from public.game_events
--    where event_type = 'choice_1'
--    group by 1, 2, 3
--    order by 1, 3;

-- How often kids used "Try differently" per moment:
--   select (data->>'moment')::int as moment, count(*) as retries
--     from public.game_events
--    where event_type = 'try_differently'
--    group by 1 order by 1;

-- What children wrote in the reflections:
--   select s.name, (e.data->>'moment')::int as moment, e.data->>'text' as reflection
--     from public.game_events e
--     left join public.students s on s.id = e.student_id
--    where e.event_type = 'reflection'
--    order by e.created_at desc;

-- Full story of one child's playthrough (replace the name):
--   select e.created_at, e.event_type, e.data
--     from public.game_events e
--     join public.students s on s.id = e.student_id
--    where s.name = 'PUT NAME HERE'
--    order by e.created_at;

-- Average score by country:
--   select s.country, count(*) as plays,
--          round(avg((e.data->>'score')::int), 1) as avg_score
--     from public.game_events e
--     join public.students s on s.id = e.student_id
--    where e.event_type = 'episode_complete'
--    group by 1 order by avg_score desc;
