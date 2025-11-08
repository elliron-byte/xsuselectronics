-- Add policy to allow admin to view all user devices with joined data
CREATE POLICY "Admins can view user devices with user info"
ON public.user_devices
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);