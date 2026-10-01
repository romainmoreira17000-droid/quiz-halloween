-- Remote board (issue #65), after the security audit: the half-second pause only slowed one request,
-- so parallel requests could multiply the guessing rate of the evening code. Checks now go one at a time.
-- `create or replace` keeps the grants: check_evening_code stays closed to anon.

create or replace function public.check_evening_code(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  -- One check at a time for the whole database: at most two wrong tries per second, however many requests run.
  -- Transaction-level lock: released at the end of the call, even on error (safe with pooled connections).
  perform pg_advisory_xact_lock(6500001);
  if p_code is null or char_length(p_code) not between 8 and 128 or not exists (
    select 1 from public.evening_secret s where s.code_hash = extensions.crypt(p_code, s.code_hash)
  ) then
    -- Slows down guessing: each wrong try costs half a second, and holds the lock meanwhile.
    perform pg_sleep(0.5);
    raise exception 'invalid evening code' using errcode = '28P01';
  end if;
end $$;
