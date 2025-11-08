
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
