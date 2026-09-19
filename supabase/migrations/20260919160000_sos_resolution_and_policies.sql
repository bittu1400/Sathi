-- Coordinator resolution note, trekker self-resolve with timestamp,
-- SOS insert limited to own treks, and self-service profile deletion.

alter table sos_events
  add column resolution_note text check (char_length(resolution_note) <= 500);

create or replace function enforce_sos_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT = SQL editor / server maintenance; RLS already keeps anon out.
  if auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;

  if not is_coordinator() then
    if new.status <> 'resolved'
      or old.status = 'resolved'
      or (to_jsonb(new) - array['status', 'resolved_at', 'resolution_note'])
        is distinct from
        (to_jsonb(old) - array['status', 'resolved_at', 'resolution_note'])
    then
      raise exception 'trekkers may only resolve their own SOS';
    end if;
  elsif (to_jsonb(new) - array['status', 'acknowledged_at', 'acknowledged_by', 'resolved_at', 'resolution_note'])
    is distinct from
    (to_jsonb(old) - array['status', 'acknowledged_at', 'acknowledged_by', 'resolved_at', 'resolution_note']) then
    raise exception 'coordinators may only update SOS status fields';
  end if;

  return new;
end;
$$;

grant update (resolution_note) on sos_events to authenticated;

drop policy sos_events_insert on sos_events;
create policy sos_events_insert on sos_events
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    trek_id is null
    or exists (
      select 1 from treks
      where treks.id = sos_events.trek_id and treks.user_id = auth.uid()
    )
  )
);

create policy profiles_delete on profiles
for delete to authenticated
using (id = auth.uid());
