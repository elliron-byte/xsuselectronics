-- Add new columns to recharge_records table for transaction tracking
ALTER TABLE public.recharge_records
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS e_wallet_number text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recharge_records_status ON public.recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_records_transaction_id ON public.recharge_records(transaction_id);

-- Update RLS policy to allow admins to update status
CREATE POLICY "Admins can update recharge status"
ON public.recharge_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));