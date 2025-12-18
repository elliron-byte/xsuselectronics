-- Update the handle_new_user function to include invitation_code
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
    invitation_code,
    balance,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    public.generate_unique_code(),
    NEW.raw_user_meta_data->>'invitation_code',
    20,
    NOW()
  );
  RETURN NEW;
END;
$function$;