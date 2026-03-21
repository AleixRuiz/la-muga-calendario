-- Drop the old policy that relies on the deprecated profiles table
drop policy if exists "Only Admins can update bar config" on bar_config;

-- Create a simplified policy for the alpha version allowing authenticated managers to configure the bar
create policy "Authenticated users can update bar config" on bar_config for update using (auth.uid() is not null);
