create function get_shared_trek(token text)
returns table (
  display_name text,
  route_id text,
  status trek_status,
  started_at timestamptz,
  latest_position jsonb,
  latest_sleep_alt_m real,
  open_sos boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.display_name,
    t.route_id,
    t.status,
    t.started_at,
    (
      select jsonb_build_object(
        'lat', round(pos.lat::numeric, 3),
        'lng', round(pos.lng::numeric, 3),
        'alt_m', pos.alt_m,
        'accuracy_m', pos.accuracy_m,
        'recorded_at', pos.recorded_at
      )
      from positions pos
      where pos.trek_id = t.id
      order by pos.recorded_at desc
      limit 1
    ) as latest_position,
    (
      select c.sleep_alt_m
      from checkins c
      where c.trek_id = t.id
      order by c.recorded_at desc
      limit 1
    ) as latest_sleep_alt_m,
    exists (
      select 1
      from sos_events s
      where s.trek_id = t.id
        and s.status in ('open', 'acknowledged')
    ) as open_sos
  from treks t
  join profiles p on p.id = t.user_id
  where t.share_token = token
  limit 1;
$$;

grant execute on function get_shared_trek(text) to anon, authenticated;

create function activate_pass()
returns setof passes
language sql
security definer
set search_path = public
as $$
  with candidate as (
    select id
    from passes
    where user_id = auth.uid()
      and status = 'purchased'
    order by created_at asc
    limit 1
    for update
  )
  update passes
  set
    status = 'active',
    activated_at = now(),
    expires_at = now() + make_interval(days => passes.days)
  from candidate
  where passes.id = candidate.id
  returning passes.*;
$$;

revoke execute on function activate_pass() from public;
grant execute on function activate_pass() to authenticated;
