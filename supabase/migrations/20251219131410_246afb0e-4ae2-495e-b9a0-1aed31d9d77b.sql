-- Add is_blocked column to registered_users table
ALTER TABLE public.registered_users 
ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- Allow admins to update the is_blocked field
-- (existing admin update policy already covers this)