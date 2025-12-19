-- Enable realtime for registered_users table to get instant block status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.registered_users;