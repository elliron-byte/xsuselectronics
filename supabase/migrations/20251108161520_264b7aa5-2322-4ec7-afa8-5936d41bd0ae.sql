-- Add last_payout_at column to track when devices last paid out
ALTER TABLE public.user_devices 
ADD COLUMN last_payout_at timestamp with time zone DEFAULT now();