-- Remote animator board (issue #65): one row per team, reached only through three functions guarded by an evening code.
-- No personal data: a team name (monster names from quiz.yaml) and its game state.

create extension if not exists pgcrypto with schema extensions;

-- Evening code, hashed (bcrypt). A single row; set by hand, never committed.
create table public.evening_secret (
  id smallint primary key default 1 check (id = 1),
  code_hash text not null
);
alter table public.evening_secret enable row level security;

create table public.team_status (
  team text primary key check (char_length(team) between 1 and 40),
  fingerprint text not null check (char_length(fingerprint) <= 64),
  state jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) <= 2048),
  updated_at timestamptz not null default now()
);
alter table public.team_status enable row level security;

-- RLS on and no policy: nobody reads or writes these tables directly, only the functions below.
revoke all on public.evening_secret, public.team_status from anon, authenticated;

create function public.check_evening_code(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_code is null or char_length(p_code) < 8 or not exists (
    select 1 from public.evening_secret s where s.code_hash = extensions.crypt(p_code, s.code_hash)
  ) then
    -- Slows down guessing: each wrong try costs half a second.
    perform pg_sleep(0.5);
    raise exception 'invalid evening code' using errcode = '28P01';
  end if;
end $$;
revoke execute on function public.check_evening_code(text) from public, anon, authenticated;

create function public.push_team_state(p_code text, p_team text, p_fingerprint text, p_state jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  if not exists (select 1 from public.team_status t where t.team = p_team) then
    -- Serialises new teams: without it, two teams joining at once could both see 11 rows and make 13.
    lock table public.team_status in share row exclusive mode;
    if (select count(*) from public.team_status) >= 12 then
      raise exception 'too many teams' using errcode = '54000';
    end if;
  end if;
  insert into public.team_status (team, fingerprint, state, updated_at)
  values (p_team, p_fingerprint, p_state, now())
  on conflict (team) do update
    set fingerprint = excluded.fingerprint, state = excluded.state, updated_at = excluded.updated_at;
end $$;

create function public.read_board(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  -- Times in ms, like Date.now() on the tablets.
  return jsonb_build_object(
    'server_now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'team', t.team, 'fingerprint', t.fingerprint, 'state', t.state,
        'updated_at', floor(extract(epoch from t.updated_at) * 1000)::bigint
      ) order by t.team)
      from public.team_status t
    ), '[]'::jsonb)
  );
end $$;

create function public.reset_board(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_evening_code(p_code);
  delete from public.team_status where true;
end $$;

-- Supabase's default privileges grant execute to anon and authenticated on every new function: revoke, then grant
-- back to anon only (the tablets have no login).
revoke execute on function public.push_team_state(text, text, text, jsonb), public.read_board(text), public.reset_board(text)
  from public, authenticated;
grant execute on function public.push_team_state(text, text, text, jsonb), public.read_board(text), public.reset_board(text)
  to anon;
