-- Add email column to registered_users table
ALTER TABLE public.registered_users
ADD COLUMN IF NOT EXISTS email text;

-- Update existing records with email from auth.users (one-time sync)
-- This will be done via a migration that safely handles the update

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.registered_users (
    user_id,
    phone,
    email,
    unique_code,
    balance,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    public.generate_unique_code(),
    20,
    NOW()
  );
  RETURN NEW;
END;
$function$;