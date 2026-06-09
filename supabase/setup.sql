-- Run this once in Supabase SQL Editor

-- Products snapshot table
create table if not exists copix_products (
  id         text primary key default 'main',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  payload    jsonb not null default '[]',
  version    bigint default 1
);

-- Settings table
create table if not exists copix_settings (
  id         text primary key default 'main',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  payload    jsonb not null default '{}'
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger copix_products_updated_at before update on copix_products
  for each row execute function update_updated_at();
create trigger copix_settings_updated_at before update on copix_settings
  for each row execute function update_updated_at();

-- RLS: allow all authenticated + anon read/write (for team use)
alter table copix_products enable row level security;
alter table copix_settings  enable row level security;

create policy "allow all" on copix_products for all using (true) with check (true);
create policy "allow all" on copix_settings  for all using (true) with check (true);
