create extension if not exists pgcrypto;

create table if not exists app_settings (
  id integer primary key default 1,
  meeting_started boolean not null default false,
  court_warning_limit integer not null default 2 check (court_warning_limit >= 1),
  skill_gap_mode text not null default 'normal' check (skill_gap_mode in ('strict', 'normal', 'loose', 'none')),
  auto_generation_default_count integer not null default 2 check (auto_generation_default_count between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  gender text not null check (gender in ('M', 'F')),
  skill integer not null check (skill between 1 and 5),
  status text not null default 'not_arrived' check (status in ('not_arrived', 'active', 'playing', 'left', 'inactive')),
  games_played integer not null default 0 check (games_played >= 0),
  last_played_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'auto' check (source in ('auto', 'manual')),
  status text not null default 'generated' check (status in ('generated', 'operation_queue', 'in_progress', 'completed', 'cancelled')),
  match_type text not null check (match_type in ('men', 'women', 'mixed', 'manual')),
  player_ids uuid[] not null check (array_length(player_ids, 1) = 4),
  generated_order integer null,
  operation_order integer null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_status_idx on players(status);
create index if not exists matches_status_idx on matches(status);
create index if not exists matches_operation_order_idx on matches(operation_order);
create index if not exists matches_generated_order_idx on matches(generated_order);

insert into app_settings (id)
values (1)
on conflict (id) do nothing;
