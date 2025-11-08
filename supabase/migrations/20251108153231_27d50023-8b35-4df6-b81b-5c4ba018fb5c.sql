-- Fix critical security vulnerabilities

-- 1. Add user_id column to link to Supabase Auth
ALTER TABLE public.registered_users 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Make phone and password nullable (will be migrated to Supabase Auth)
ALTER TABLE public.registered_users 
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;

-- 3. Drop all dangerous RLS policies
DROP POLICY IF EXISTS "Anyone can check phone existence" ON public.registered_users;
DROP POLICY IF EXISTS "Anyone can register" ON public.registered_users;
DROP POLICY IF EXISTS "Users can update their own balance" ON public.registered_users;

-- 4. Create secure RLS policies for registered_users
CREATE POLICY "Users can view own profile"
ON public.registered_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.registered_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.registered_users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Fix user_devices RLS policies
DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.user_devices;

-- Add user_id to user_devices for proper auth
ALTER TABLE public.user_devices
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can view own devices"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registered_users (
    user_id,
    phone,
    unique_code,
    balance,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    public.generate_unique_code(),
    20,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 7. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();