-- We want to allow managers to create employees without forcing them to register via Supabase Auth immediately.
-- Create employees table
create table employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  role user_role default 'general',
  email text,
  phone text,
  color_code text default '#3b82f6',
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for employees
alter table employees enable row level security;
create policy "Everyone can view employees" on employees for select using (true);
create policy "Authenticated users can manage employees" on employees for all using (auth.uid() is not null);

-- Modify shifts table to reference employees instead of profiles
alter table shifts drop constraint if exists shifts_user_id_fkey;
-- Note: existing user_id column is uuid, which matches employee id
alter table shifts add constraint shifts_user_id_fkey foreign key (user_id) references employees(id) on delete cascade;

-- Remove strict checks on who can manage shifts temporarily, let any authenticated user do it for simplicity in alpha
drop policy if exists "Managers can insert shifts" on shifts;
drop policy if exists "Managers can update shifts" on shifts;
drop policy if exists "Managers can delete shifts" on shifts;

create policy "Authenticated users can insert shifts" on shifts for insert with check (auth.uid() is not null);
create policy "Authenticated users can update shifts" on shifts for update using (auth.uid() is not null);
create policy "Authenticated users can delete shifts" on shifts for delete using (auth.uid() is not null);
