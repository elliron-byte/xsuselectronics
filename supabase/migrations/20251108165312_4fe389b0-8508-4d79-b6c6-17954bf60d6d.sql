-- Create income_records table to track daily income from devices
CREATE TABLE public.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.user_devices(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create recharge_records table to track balance increases
CREATE TABLE public.recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create withdraw_records table to track withdrawal requests
CREATE TABLE public.withdraw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'successful'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for income_records
CREATE POLICY "Users can view own income records"
  ON public.income_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert income records"
  ON public.income_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recharge_records
CREATE POLICY "Users can view own recharge records"
  ON public.recharge_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recharge records"
  ON public.recharge_records FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert recharge records"
  ON public.recharge_records FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for withdraw_records
CREATE POLICY "Users can view own withdraw records"
  ON public.withdraw_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdraw records"
  ON public.withdraw_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdraw records"
  ON public.withdraw_records FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdraw records"
  ON public.withdraw_records FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));