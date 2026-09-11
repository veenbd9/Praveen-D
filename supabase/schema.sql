-- ScaleupResume Supabase schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)

-- 1. Profiles table (extends auth.users with app-specific fields)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  is_admin boolean not null default false,
  country_code text default '+91',
  phone_number text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  resume_mismatch_count integer not null default 0,
  subscription jsonb not null default jsonb_build_object(
    'isActive', true,
    'planType', 'free',
    'startDate', extract(epoch from now()) * 1000,
    'expiryDate', 9999999999999,
    'hasCompletedThreeMonthPlan', false,
    'usageCount', 0,
    'resumeLimit', 1,
    'lastUsageReset', extract(epoch from now()) * 1000
  ),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read/update only their own profile; admins can read all via service role.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

-- 2. Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, country_code, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'country_code', '+91'),
    new.raw_user_meta_data->>'phone_number'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Transactions table (payments from Stripe/Razorpay)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_name text,
  amount numeric not null,
  tax_amount numeric,
  net_amount numeric,
  currency text not null,
  type text not null check (type in ('CREDIT', 'DEBIT')),
  description text,
  method text not null check (method in ('UPI', 'BANK_TRANSFER', 'CARD', 'INTERNAL')),
  status text not null check (status in ('SUCCESS', 'PENDING', 'FAILED')),
  provider text check (provider in ('stripe', 'razorpay')),
  provider_ref text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

-- Inserts/updates to transactions are performed only by the serverless webhook
-- handlers using the Supabase service_role key, which bypasses RLS.

-- 4. Reviews cache (optional — if you want to store/moderate Google Reviews locally)
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  author_name text,
  rating integer check (rating between 1 and 5),
  text text,
  relative_time text,
  profile_photo_url text,
  fetched_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are publicly readable" on public.reviews;
create policy "Reviews are publicly readable" on public.reviews
  for select using (true);
