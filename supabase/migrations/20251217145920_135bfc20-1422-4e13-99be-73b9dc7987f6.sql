-- Create bonus_codes table with predefined codes
CREATE TABLE public.bonus_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  max_uses integer NOT NULL DEFAULT 30,
  current_uses integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bonus_code_redemptions table to track who used what code
CREATE TABLE public.bonus_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_id uuid REFERENCES public.bonus_codes(id) NOT NULL,
  amount numeric NOT NULL,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, code_id)
);

-- Enable RLS
ALTER TABLE public.bonus_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for bonus_codes (everyone can read)
CREATE POLICY "Anyone can view bonus codes"
ON public.bonus_codes
FOR SELECT
USING (true);

-- RLS policies for bonus_code_redemptions
CREATE POLICY "Users can view own redemptions"
ON public.bonus_code_redemptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
ON public.bonus_code_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert the predefined bonus codes
INSERT INTO public.bonus_codes (code, amount, max_uses) VALUES
  ('BY4W2', 1, 30),
  ('XSUS3L3C', 2, 30),
  ('XSUS@26', 1, 30),
  ('F6HT3', 2, 30),
  ('UY67S', 1, 30),
  ('ELLIRON', 2, 30),
  ('FORSON', 1, 30);

-- Create function to redeem bonus code
CREATE OR REPLACE FUNCTION public.redeem_bonus_code(p_user_id uuid, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code_id uuid;
  v_amount numeric;
  v_max_uses integer;
  v_current_uses integer;
  v_already_redeemed boolean;
  v_new_balance numeric;
BEGIN
  -- Find the bonus code
  SELECT id, amount, max_uses, current_uses
  INTO v_code_id, v_amount, v_max_uses, v_current_uses
  FROM bonus_codes
  WHERE UPPER(code) = UPPER(p_code)
  FOR UPDATE;
  
  -- Check if code exists
  IF v_code_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid bonus code');
  END IF;
  
  -- Check if code has reached max uses
  IF v_current_uses >= v_max_uses THEN
    RETURN json_build_object('success', false, 'error', 'This bonus code has expired');
  END IF;
  
  -- Check if user already redeemed this code
  SELECT EXISTS(
    SELECT 1 FROM bonus_code_redemptions WHERE user_id = p_user_id AND code_id = v_code_id
  ) INTO v_already_redeemed;
  
  IF v_already_redeemed THEN
    RETURN json_build_object('success', false, 'error', 'You have already used this bonus code');
  END IF;
  
  -- Update bonus code usage count
  UPDATE bonus_codes SET current_uses = current_uses + 1 WHERE id = v_code_id;
  
  -- Add balance to user
  UPDATE registered_users
  SET balance = balance + v_amount
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Record the redemption
  INSERT INTO bonus_code_redemptions (user_id, code_id, amount)
  VALUES (p_user_id, v_code_id, v_amount);
  
  RETURN json_build_object('success', true, 'amount', v_amount, 'new_balance', v_new_balance);
END;
$$;