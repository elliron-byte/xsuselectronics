-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL,
  operation text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, operation)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_operation text,
  p_max_attempts integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  -- Get current rate limit data
  SELECT attempt_count, window_start
  INTO v_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND operation = p_operation;
  
  -- If no record exists or window expired, create/reset
  IF v_count IS NULL OR (now() - v_window_start) > (p_window_minutes || ' minutes')::interval THEN
    INSERT INTO rate_limits (user_id, operation, attempt_count, window_start)
    VALUES (p_user_id, p_operation, 1, now())
    ON CONFLICT (user_id, operation) 
    DO UPDATE SET attempt_count = 1, window_start = now();
    RETURN true;
  END IF;
  
  -- Check if within limit
  IF v_count < p_max_attempts THEN
    UPDATE rate_limits
    SET attempt_count = attempt_count + 1
    WHERE user_id = p_user_id AND operation = p_operation;
    RETURN true;
  END IF;
  
  -- Rate limit exceeded
  RETURN false;
END;
$$;

-- Prevent multiple pending withdrawals per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_withdrawal 
ON public.withdraw_records (user_id) 
WHERE status = 'pending';

-- Add minimum withdrawal constraint
ALTER TABLE public.withdraw_records
DROP CONSTRAINT IF EXISTS min_withdrawal_amount;

ALTER TABLE public.withdraw_records
ADD CONSTRAINT min_withdrawal_amount CHECK (amount >= 20);