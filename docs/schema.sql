
-- SQL schema for LG Pay on Supabase

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can manage their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can manage their own sell orders." ON public.sell_orders;
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can view payment methods." ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage their own chat requests." ON public.chat_requests;
DROP POLICY IF EXISTS "Anyone can create a new chat request." ON public.chat_requests;
DROP POLICY IF EXISTS "Users can manage their own reports." ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can submit feedback." ON public.feedback;
DROP POLICY IF EXISTS "Users can manage their own daily rewards." ON public.daily_rewards;


-- USERS Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY,
  numeric_id text NOT NULL UNIQUE,
  email text UNIQUE,
  phone_number text,
  display_name text,
  photo_url text,
  balance numeric DEFAULT 0,
  hold_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  inviter_uid uuid,
  claimed_user_rewards text[],
  payment_methods jsonb,
  session_id text,
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  order_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  base_amount numeric,
  bonus_percentage numeric,
  payment_type text,
  payment_provider text,
  admin_payment_method_id uuid,
  seller_id uuid,
  seller_withdrawal_details jsonb,
  status text NOT NULL,
  cancellation_reason text,
  rejection_reason text,
  utr text,
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  verification_result text,
  matched_sell_order_path text,
  ocr_verified boolean,
  ocr_utr_match boolean,
  ocr_amount_match boolean,
  ocr_upi_match boolean,
  ocr_bank_account_match boolean
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own orders." ON public.orders
  FOR ALL USING (auth.uid() = user_id);


-- SELL ORDERS Table
CREATE TABLE IF NOT EXISTS public.sell_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  order_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  remaining_amount numeric,
  withdrawal_method jsonb NOT NULL,
  status text NOT NULL,
  matched_buy_orders jsonb,
  utr text,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.sell_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sell orders." ON public.sell_orders
  FOR ALL USING (auth.uid() = user_id);


-- TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  order_id text,
  amount numeric NOT NULL,
  description text,
  type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions." ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
-- Note: Inserts should be done with service_role key from the server.


-- PAYMENT METHODS Table (Admin)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  bank_name text,
  account_holder_name text,
  account_number text,
  ifsc_code text,
  upi_holder_name text,
  upi_id text,
  usdt_wallet_address text
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view payment methods." ON public.payment_methods
  FOR SELECT USING (auth.role() = 'authenticated');
-- Note: Admin should manage this table with service_role key.


-- CHAT REQUESTS Table
CREATE TABLE IF NOT EXISTS public.chat_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    user_numeric_id text,
    entered_identifier text NOT NULL,
    status text NOT NULL,
    created_at timestamptz DEFAULT now(),
    chat_history jsonb,
    agent_id text,
    agent_joined_at timestamptz
);
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat requests." ON public.chat_requests
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create a new chat request." ON public.chat_requests
  FOR INSERT WITH CHECK (true);


-- REPORTS Table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  case_id text NOT NULL,
  user_numeric_id text,
  order_id text NOT NULL,
  display_order_id text,
  order_type text,
  problem_type text NOT NULL,
  message text,
  screenshot_url text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  status text,
  resolution_message text
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reports." ON public.reports
  FOR ALL USING (auth.uid() = user_id);


-- FEEDBACK Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  user_numeric_id text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can submit feedback." ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Note: Only admin should be able to read feedback, using service_role key.


-- DAILY REWARDS Table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  date date NOT NULL,
  claimed_task_ids text[],
  UNIQUE (user_id, date)
);
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily rewards." ON public.daily_rewards
  FOR ALL USING (auth.uid() = user_id);
