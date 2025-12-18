-- Update process_device_purchase to give 5% commission to referrer
CREATE OR REPLACE FUNCTION public.process_device_purchase(p_user_id uuid, p_device_name text, p_product_price numeric, p_daily_income numeric, p_total_income numeric, p_device_number integer, p_user_phone text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_new_balance numeric;
  v_device_id uuid;
  v_invitation_code text;
  v_referrer_id uuid;
  v_commission numeric;
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
  
  -- Check if user was referred by someone and give 5% commission
  SELECT invitation_code INTO v_invitation_code
  FROM registered_users
  WHERE user_id = p_user_id;
  
  IF v_invitation_code IS NOT NULL AND v_invitation_code != '' THEN
    -- Find the referrer by their unique_code
    SELECT user_id INTO v_referrer_id
    FROM registered_users
    WHERE unique_code = v_invitation_code;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Calculate 5% commission
      v_commission := p_product_price * 0.05;
      
      -- Credit commission to referrer
      UPDATE registered_users
      SET balance = balance + v_commission
      WHERE user_id = v_referrer_id;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'device_id', v_device_id
  );
END;
$function$;