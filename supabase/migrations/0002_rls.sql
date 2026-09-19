create function is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'coordinator'
  );
$$;

create function my_agency()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from profiles
  where id = auth.uid() and role = 'agency_admin';
$$;

create function prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
    and (new.role is distinct from old.role or new.agency_id is distinct from old.agency_id)
  then
    raise exception 'role and agency_id cannot be changed by the client';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_and_agency
before update on profiles
for each row execute function prevent_profile_role_change();

create function enforce_sos_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not is_coordinator() then
    if new.status <> 'resolved'
      or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status')
    then
      raise exception 'trekkers may only resolve their own SOS';
    end if;
  elsif (to_jsonb(new) - array['status', 'acknowledged_at', 'acknowledged_by', 'resolved_at'])
    is distinct from
    (to_jsonb(old) - array['status', 'acknowledged_at', 'acknowledged_by', 'resolved_at']) then
    raise exception 'coordinators may only update SOS status fields';
  end if;

  return new;
end;
$$;

create trigger enforce_sos_update_scope
before update on sos_events
for each row execute function enforce_sos_update_scope();

alter table agencies enable row level security;
alter table profiles enable row level security;
alter table treks enable row level security;
alter table positions enable row level security;
alter table checkins enable row level security;
alter table alerts enable row level security;
alter table sos_events enable row level security;
alter table passes enable row level security;

create policy agencies_select on agencies
for select to authenticated
using (
  id = (select agency_id from profiles where id = auth.uid())
  or is_coordinator()
);

create policy profiles_select on profiles
for select to authenticated
using (
  id = auth.uid()
  or is_coordinator()
  or agency_id = my_agency()
);

create policy profiles_update on profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy treks_select on treks
for select to authenticated
using (
  user_id = auth.uid()
  or is_coordinator()
  or exists (
    select 1 from profiles
    where profiles.id = treks.user_id
      and profiles.agency_id = my_agency()
  )
);

create policy treks_insert on treks
for insert to authenticated
with check (user_id = auth.uid());

create policy treks_update on treks
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy treks_delete on treks
for delete to authenticated
using (user_id = auth.uid());

create policy positions_select on positions
for select to authenticated
using (
  is_coordinator()
  or exists (
    select 1 from treks
    join profiles on profiles.id = treks.user_id
    where treks.id = positions.trek_id
      and (
        treks.user_id = auth.uid()
        or profiles.agency_id = my_agency()
      )
  )
);

create policy positions_insert on positions
for insert to authenticated
with check (
  exists (
    select 1 from treks
    where treks.id = positions.trek_id and treks.user_id = auth.uid()
  )
);

create policy positions_update on positions
for update to authenticated
using (
  exists (
    select 1 from treks
    where treks.id = positions.trek_id and treks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from treks
    where treks.id = positions.trek_id and treks.user_id = auth.uid()
  )
);

create policy checkins_select on checkins
for select to authenticated
using (
  is_coordinator()
  or exists (
    select 1 from treks
    join profiles on profiles.id = treks.user_id
    where treks.id = checkins.trek_id
      and (
        treks.user_id = auth.uid()
        or profiles.agency_id = my_agency()
      )
  )
);

create policy checkins_insert on checkins
for insert to authenticated
with check (
  exists (
    select 1 from treks
    where treks.id = checkins.trek_id and treks.user_id = auth.uid()
  )
);

create policy checkins_update on checkins
for update to authenticated
using (
  exists (
    select 1 from treks
    where treks.id = checkins.trek_id and treks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from treks
    where treks.id = checkins.trek_id and treks.user_id = auth.uid()
  )
);

create policy alerts_select on alerts
for select to authenticated
using (
  is_coordinator()
  or exists (
    select 1 from treks
    join profiles on profiles.id = treks.user_id
    where treks.id = alerts.trek_id
      and (
        treks.user_id = auth.uid()
        or profiles.agency_id = my_agency()
      )
  )
);

create policy alerts_insert on alerts
for insert to authenticated
with check (
  exists (
    select 1 from treks
    where treks.id = alerts.trek_id and treks.user_id = auth.uid()
  )
);

create policy alerts_update on alerts
for update to authenticated
using (
  exists (
    select 1 from treks
    where treks.id = alerts.trek_id and treks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from treks
    where treks.id = alerts.trek_id and treks.user_id = auth.uid()
  )
);

create policy sos_events_select on sos_events
for select to authenticated
using (
  user_id = auth.uid()
  or is_coordinator()
  or exists (
    select 1 from treks
    join profiles on profiles.id = treks.user_id
    where treks.id = sos_events.trek_id
      and profiles.agency_id = my_agency()
  )
);

create policy sos_events_insert on sos_events
for insert to authenticated
with check (user_id = auth.uid());

create policy sos_events_update_own on sos_events
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status = 'resolved'
);

create policy sos_events_update_coordinator on sos_events
for update to authenticated
using (is_coordinator())
with check (is_coordinator());

revoke update on sos_events from authenticated;
grant update (status, acknowledged_at, acknowledged_by, resolved_at)
on sos_events to authenticated;

create policy passes_select on passes
for select to authenticated
using (user_id = auth.uid());
