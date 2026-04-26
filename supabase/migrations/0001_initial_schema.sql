-- =============================================================
-- 0001_initial_schema.sql
-- Run once in the Supabase SQL Editor.
-- =============================================================


-- =============================================================
-- TABLES
-- =============================================================

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  paycheck_day     int check (paycheck_day between 1 and 31),
  paycheck_amount  numeric(10,2),
  buffer_amount    numeric(10,2) not null default 0,
  language         text not null default 'en',
  currency         text not null default 'EUR',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.balance_updates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  balance      numeric(10,2) not null,
  recorded_at  timestamptz not null default now()
);

create table public.bills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  amount        numeric(10,2) not null,
  day_of_month  int not null check (day_of_month between 1 and 31),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);


-- =============================================================
-- INDEXES
-- =============================================================

create index balance_updates_user_id_recorded_at_idx
  on public.balance_updates (user_id, recorded_at desc);

create index bills_user_id_active_idx
  on public.bills (user_id)
  where active = true;


-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- =============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles       enable row level security;
alter table public.balance_updates enable row level security;
alter table public.bills           enable row level security;

-- profiles
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- balance_updates
create policy "users can view own balance updates"
  on public.balance_updates for select
  using (auth.uid() = user_id);

create policy "users can insert own balance updates"
  on public.balance_updates for insert
  with check (auth.uid() = user_id);

create policy "users can update own balance updates"
  on public.balance_updates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own balance updates"
  on public.balance_updates for delete
  using (auth.uid() = user_id);

-- bills
create policy "users can view own bills"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "users can insert own bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "users can update own bills"
  on public.bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own bills"
  on public.bills for delete
  using (auth.uid() = user_id);
