-- Remove unused password column from registered_users
ALTER TABLE public.registered_users DROP COLUMN IF EXISTS password;

-- Create secure function for device income crediting with proper locking
CREATE OR REPLACE FUNCTION public.credit_device_income(
  p_device_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_daily_income numeric;
  v_device_name text;
  v_balance numeric;
  v_last_payout timestamptz;
BEGIN
  -- Get device info with row lock to prevent race conditions
  SELECT user_id, daily_income::numeric, device_name, last_payout_at
  INTO v_user_id, v_daily_income, v_device_name, v_last_payout
  FROM user_devices
  WHERE id = p_device_id
  FOR UPDATE;
  
  -- Check if device exists
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Device not found');
  END IF;
  
  -- Check if 24 hours passed
  IF v_last_payout + interval '24 hours' > now() THEN
    RETURN json_build_object('success', false, 'error', 'Too early - must wait 24 hours');
  END IF;
  
  -- Lock user row and update balance atomically
  UPDATE registered_users
  SET balance = balance + v_daily_income
  WHERE user_id = v_user_id
  RETURNING balance INTO v_balance;
  
  -- Update device payout time
  UPDATE user_devices
  SET last_payout_at = now()
  WHERE id = p_device_id;
  
  -- Insert income record
  INSERT INTO income_records (user_id, device_id, device_name, amount)
  VALUES (v_user_id, p_device_id, v_device_name, v_daily_income);
  
  RETURN json_build_object('success', true, 'new_balance', v_balance, 'amount', v_daily_income);
END;
$$;

-- Create secure function for withdrawal with validation
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id uuid,
  p_amount numeric
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_has_device boolean;
  v_new_balance numeric;
BEGIN
  -- Lock the user row to prevent race conditions
  SELECT balance INTO v_balance 
  FROM registered_users
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user exists
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Server-side validation
  IF p_amount < 20 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is GHS 20');
  END IF;
  
  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Verify user has invested in at least one device
  SELECT EXISTS(SELECT 1 FROM user_devices WHERE user_id = p_user_id) INTO v_has_device;
  IF NOT v_has_device THEN
    RETURN json_build_object('success', false, 'error', 'You must invest in a device before withdrawing');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_balance - p_amount;
  
  -- Atomic operations in transaction
  UPDATE registered_users 
  SET balance = v_new_balance
  WHERE user_id = p_user_id;
  
  INSERT INTO withdraw_records (user_id, amount, status) 
  VALUES (p_user_id, p_amount, 'pending');
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Create secure function for device purchase
CREATE OR REPLACE FUNCTION public.process_device_purchase(
  p_user_id uuid,
  p_device_name text,
  p_product_price numeric,
  p_daily_income numeric,
  p_total_income numeric,
  p_device_number integer,
  p_user_phone text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_new_balance numeric;
  v_device_id uuid;
BEGIN
  -- Lock user row and get balance
  SELECT balance INTO v_balance
  FROM registered_users
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Server-side validation
  IF v_balance < p_product_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  IF p_product_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid device price');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_balance - p_product_price;
  
  -- Deduct balance atomically
  UPDATE registered_users
  SET balance = v_new_balance
  WHERE user_id = p_user_id;
  
  -- Insert device record
  INSERT INTO user_devices (
    user_id,
    device_name,
    product_price,
    daily_income,
    total_income,
    device_number,
    user_phone,
    last_payout_at
  ) VALUES (
    p_user_id,
    p_device_name,
    p_product_price::text,
    p_daily_income::text,
    p_total_income::text,
    p_device_number,
    p_user_phone,
    now()
  ) RETURNING id INTO v_device_id;
  
  RETURN json_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'device_id', v_device_id
  );
END;
$$;

-- Create secure function for check-in
CREATE OR REPLACE FUNCTION public.process_checkin(
  p_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_checkin timestamptz;
  v_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Lock user row
  SELECT last_checkin_at, balance 
  INTO v_last_checkin, v_balance
  FROM registered_users
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- SERVER-SIDE validation of 24 hour cooldown
  IF v_last_checkin IS NOT NULL AND 
     v_last_checkin + interval '24 hours' > now() THEN
    RETURN json_build_object('success', false, 'error', 'Must wait 24 hours between check-ins');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_balance + 1;
  
  -- Atomic update
  UPDATE registered_users
  SET balance = v_new_balance,
      last_checkin_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Create secure function for admin balance updates
CREATE OR REPLACE FUNCTION public.admin_add_balance(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_amount numeric,
  p_transaction_id text,
  p_e_wallet_number text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Verify admin role
  SELECT has_role(p_admin_user_id, 'admin'::app_role) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized - admin access required');
  END IF;
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;
  
  -- Lock user row and get current balance
  SELECT balance INTO v_current_balance
  FROM registered_users
  WHERE user_id = p_target_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;
  
  -- Update balance atomically
  UPDATE registered_users
  SET balance = v_new_balance
  WHERE user_id = p_target_user_id;
  
  -- Create recharge record
  INSERT INTO recharge_records (
    user_id,
    amount,
    previous_balance,
    new_balance,
    transaction_id,
    e_wallet_number,
    status
  ) VALUES (
    p_target_user_id,
    p_amount,
    v_current_balance,
    v_new_balance,
    p_transaction_id,
    p_e_wallet_number,
    'success'
  );
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;