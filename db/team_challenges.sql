-- Teams Tabelle
create table if not exists teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by integer references users(id),
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Team-Mitglieder Tabelle
create table if not exists team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('leader', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(team_id, user_id)
);

-- Challenges Tabelle
create table if not exists challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  reward text,
  points integer default 0,
  start_date timestamp with time zone default timezone('utc'::text, now()),
  end_date timestamp with time zone not null,
  goal integer not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Challenge-Fortschritt Tabelle
create table if not exists challenge_progress (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references challenges(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  progress integer default 0,
  last_updated timestamp with time zone default timezone('utc'::text, now()),
  unique(challenge_id, team_id)
);

-- Trigger für automatische Aktualisierung von updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_teams_updated_at
  before update on teams
  for each row
  execute function update_updated_at_column();

-- Indizes für bessere Performance
create index if not exists idx_team_members_team_id on team_members(team_id);
create index if not exists idx_team_members_user_id on team_members(user_id);
create index if not exists idx_challenge_progress_challenge_id on challenge_progress(challenge_id);
create index if not exists idx_challenge_progress_team_id on challenge_progress(team_id);

-- RLS-Policies für Sicherheit
alter table teams enable row level security;
alter table team_members enable row level security;
alter table challenges enable row level security;
alter table challenge_progress enable row level security;

-- Teams können von allen gesehen werden
create policy "Teams sind öffentlich sichtbar"
  on teams for select
  to authenticated
  using (true);

-- Nur Admins können Teams erstellen
create policy "Nur Admins können Teams erstellen"
  on teams for insert
  to authenticated
  using (exists (
    select 1 from users
    where users.id = auth.uid()
    and users.role = 'admin'
  ));

-- Team-Mitglieder können von allen gesehen werden
create policy "Team-Mitglieder sind öffentlich sichtbar"
  on team_members for select
  to authenticated
  using (true);

-- Challenges sind für alle sichtbar
create policy "Challenges sind öffentlich sichtbar"
  on challenges for select
  to authenticated
  using (true);

-- Challenge-Fortschritt ist für alle sichtbar
create policy "Challenge-Fortschritt ist öffentlich sichtbar"
  on challenge_progress for select
  to authenticated
  using (true);

-- Nur Team-Mitglieder können den Fortschritt aktualisieren
create policy "Nur Team-Mitglieder können Fortschritt aktualisieren"
  on challenge_progress for insert
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = challenge_progress.team_id
      and team_members.user_id = auth.uid()
    )
  ); 