-- Allow admins to delete users from registered_users table
CREATE POLICY "Admins can delete users"
ON public.registered_users
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));