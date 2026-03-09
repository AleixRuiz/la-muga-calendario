-- Supabase Database Schema for Staff Management App

-- Enable PostGIS for possible future extensions regarding bar locations or staff radius
-- create extension if not exists postgis schema extensions;

-- Create Roles Enum
create type user_role as enum ('admin', 'manager', 'server', 'kitchen', 'general');

-- 1. PROFILES table (extending Supabase Auth Users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  role user_role default 'general',
  avatar_url text,
  color_code text default '#3b82f6', -- for calendar rendering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Protect profiles with RLS
alter table profiles enable row level security;
-- Admins/Managers can view all
create policy "Everyone can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. BAR CONFIGURATION table (Admin settings)
create table bar_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opening_time time default '08:00:00',
  closing_time time default '02:00:00',
  days_open jsonb default '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]',
  max_capacity_per_shift integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Protect config
alter table bar_config enable row level security;
create policy "Anyone can read bar config" on bar_config for select using (true);
create policy "Only Admins can update bar config" on bar_config for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 3. SHIFTS table (The visual calendar data)
create table shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null, -- who is working
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  role_assigned user_role not null, -- what role are they doing on this specific shift
  status text check (status in ('scheduled', 'completed', 'no_show', 'sick')) default 'scheduled',
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shifts RLS (Visible to everyone, editable by Admin/Manager)
alter table shifts enable row level security;
create policy "Staff can see all shifts" on shifts for select using (true);
create policy "Managers can insert shifts" on shifts for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'manager'))
);
create policy "Managers can update shifts" on shifts for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'manager'))
);
create policy "Managers can delete shifts" on shifts for delete using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'manager'))
);

-- 4. SHIFT TEMPLATES (To store a typical week structure)
create table shift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g., "Busy Summer Weekend", "Standard Winter Week"
  template_data jsonb not null, -- Stores relative shift times, required roles, required headcount
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert dummy Configuration record
insert into bar_config (name) values ('My Excellent Bar');
