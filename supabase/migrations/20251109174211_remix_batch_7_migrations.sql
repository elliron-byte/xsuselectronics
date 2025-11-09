
-- Migration: 20251108152822

-- Migration: 20251105145903
-- Create a table to store registered users
CREATE TABLE public.registered_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  invitation_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to check if phone exists (for login/signup validation)
CREATE POLICY "Anyone can check phone existence"
ON public.registered_users
FOR SELECT
USING (true);

-- Create policy to allow anyone to insert new users (for registration)
CREATE POLICY "Anyone can register"
ON public.registered_users
FOR INSERT
WITH CHECK (true);

-- Migration: 20251105150322
-- Create a table to store user device purchases
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_number INTEGER NOT NULL,
  product_price TEXT NOT NULL,
  daily_income TEXT NOT NULL,
  total_income TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own devices
CREATE POLICY "Users can view their own devices"
ON public.user_devices
FOR SELECT
USING (true);

-- Create policy to allow users to insert their own devices
CREATE POLICY "Users can insert their own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (true);

-- Migration: 20251106152655
-- Add unique_code column to registered_users table
ALTER TABLE public.registered_users 
ADD COLUMN unique_code text UNIQUE;

-- Create a function to generate unique 5-digit codes
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 5-digit number
    new_code := LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0');
    
    -- Check if this code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.registered_users WHERE unique_code = new_code
    ) INTO code_exists;
    
    -- If code doesn't exist, use it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Migration: 20251106152727
-- Fix the function to have a proper search_path
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 5-digit number
    new_code := LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0');
    
    -- Check if this code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.registered_users WHERE unique_code = new_code
    ) INTO code_exists;
    
    -- If code doesn't exist, use it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Migration: 20251107161502
-- Add balance and last check-in tracking to registered_users table
ALTER TABLE public.registered_users 
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS last_checkin_at timestamp with time zone;

-- Create RLS policies for balance updates
CREATE POLICY "Users can update their own balance" 
ON public.registered_users 
FOR UPDATE 
USING (phone = phone)
WITH CHECK (phone = phone);


-- Migration: 20251108153231
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

-- Migration: 20251108154040
-- Create admin role system with proper security

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. RLS policies for user_roles (users can view their own roles)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 7. Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Update registered_users policies to allow admin access
CREATE POLICY "Admins can view all profiles"
ON public.registered_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.registered_users
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Update user_devices policies to allow admin access
CREATE POLICY "Admins can view all devices"
ON public.user_devices
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Create trigger to assign 'user' role to new signups by default
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign 'user' role to new users by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if this is the admin email and assign admin role
  IF NEW.email = 'admindashboard@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_role();

-- Migration: 20251108160716
-- Add policy to allow admin to view all user devices with joined data
CREATE POLICY "Admins can view user devices with user info"
ON public.user_devices
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Migration: 20251108161519
-- Add last_payout_at column to track when devices last paid out
ALTER TABLE public.user_devices 
ADD COLUMN last_payout_at timestamp with time zone DEFAULT now();

-- Migration: 20251108165311
-- Create income_records table to track daily income from devices
CREATE TABLE public.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.user_devices(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create recharge_records table to track balance increases
CREATE TABLE public.recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create withdraw_records table to track withdrawal requests
CREATE TABLE public.withdraw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'successful'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for income_records
CREATE POLICY "Users can view own income records"
  ON public.income_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert income records"
  ON public.income_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recharge_records
CREATE POLICY "Users can view own recharge records"
  ON public.recharge_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recharge records"
  ON public.recharge_records FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert recharge records"
  ON public.recharge_records FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for withdraw_records
CREATE POLICY "Users can view own withdraw records"
  ON public.withdraw_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdraw records"
  ON public.withdraw_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdraw records"
  ON public.withdraw_records FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdraw records"
  ON public.withdraw_records FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Migration: 20251109091637
-- Create withdrawal accounts table
CREATE TABLE IF NOT EXISTS public.withdrawal_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own withdrawal accounts"
ON public.withdrawal_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal accounts"
ON public.withdrawal_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal accounts"
ON public.withdrawal_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own withdrawal accounts"
ON public.withdrawal_accounts
FOR DELETE
USING (auth.uid() = user_id);
