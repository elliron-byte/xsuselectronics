-- Allow users to insert their own recharge records
CREATE POLICY "Users can insert own recharge records"
ON public.recharge_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);