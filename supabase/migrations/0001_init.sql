create type user_role as enum ('trekker', 'coordinator', 'agency_admin');
create type trek_status as enum ('planned', 'active', 'completed', 'aborted');
create type severity as enum ('info', 'caution', 'warning', 'danger');
create type sos_status as enum ('open', 'acknowledged', 'resolved');
create type pass_status as enum ('pending', 'purchased', 'active', 'expired');

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Trekker',
  role user_role not null default 'trekker',
  agency_id uuid references agencies,
  emergency_contact_name text,
  emergency_contact_phone text,
  fitness text check (fitness in ('low', 'medium', 'high')),
  preferences jsonb,
  created_at timestamptz not null default now()
);

create table treks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  route_id text not null,
  status trek_status not null default 'planned',
  started_at timestamptz,
  ended_at timestamptz,
  share_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

create index on treks (user_id);
create unique index one_active_trek on treks (user_id) where status = 'active';

create table positions (
  id uuid primary key,
  trek_id uuid not null references treks on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  alt_m real,
  accuracy_m real,
  recorded_at timestamptz not null,
  source text not null check (source in ('gps', 'demo'))
);

create index on positions (trek_id, recorded_at desc);

create table checkins (
  id uuid primary key,
  trek_id uuid not null references treks on delete cascade,
  recorded_at timestamptz not null,
  headache smallint not null check (headache between 0 and 3),
  gi smallint not null check (gi between 0 and 3),
  fatigue smallint not null check (fatigue between 0 and 3),
  dizziness smallint not null check (dizziness between 0 and 3),
  red_flags text[] not null default '{}',
  sleep_waypoint_id text,
  sleep_alt_m real,
  lls smallint generated always as (headache + gi + fatigue + dizziness) stored
);

create index on checkins (trek_id, recorded_at desc);

create table alerts (
  id uuid primary key,
  trek_id uuid not null references treks on delete cascade,
  kind text not null,
  severity severity not null,
  title text not null,
  body text not null,
  actions text[] not null default '{}',
  dedupe_key text not null,
  created_at timestamptz not null,
  acknowledged_at timestamptz,
  unique (trek_id, dedupe_key)
);

create table sos_events (
  id uuid primary key,
  trek_id uuid references treks on delete set null,
  user_id uuid not null references profiles on delete cascade,
  lat double precision,
  lng double precision,
  alt_m real,
  accuracy_m real,
  category text not null check (category in ('altitude_illness', 'injury', 'lost', 'weather', 'other')),
  note text check (char_length(note) <= 500),
  last_checkin_lls smallint,
  created_at timestamptz not null,
  received_at timestamptz not null default now(),
  channel text not null check (channel in ('online', 'queued', 'sms')),
  status sos_status not null default 'open',
  acknowledged_by uuid references profiles,
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create index on sos_events (status, received_at desc);

create table passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  tier text not null check (tier in ('pass7', 'pass14', 'pass30', 'annual')),
  days int not null check (days in (7, 14, 30, 365)),
  status pass_status not null default 'pending',
  provider text not null check (provider in ('esewa', 'mock')),
  payment_ref text not null unique,
  amount_npr int not null check (amount_npr > 0),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Trekker'));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

alter publication supabase_realtime add table sos_events, positions, alerts, treks;
