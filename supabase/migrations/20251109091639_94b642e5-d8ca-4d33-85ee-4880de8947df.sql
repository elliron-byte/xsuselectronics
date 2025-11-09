-- Create withdrawal accounts table
CREATE TABLE IF NOT EXISTS public.withdrawal_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own withdrawal accounts"
ON public.withdrawal_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal accounts"
ON public.withdrawal_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal accounts"
ON public.withdrawal_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own withdrawal accounts"
ON public.withdrawal_accounts
FOR DELETE
USING (auth.uid() = user_id);