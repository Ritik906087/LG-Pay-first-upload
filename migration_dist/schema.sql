-- This script resets the entire public schema and recreates it for the application.
-- WARNING: This is a destructive action and will delete all data in your public schema.

-- 1. Drop existing objects to ensure a clean slate
DROP TABLE IF EXISTS public.users, public.orders, public.sell_orders, public.transactions, public.payment_methods, public.chat_requests, public.reports, public.feedback, public.daily_rewards CASCADE;
DROP TYPE IF EXISTS public.order_status, public.sell_order_status, public.payment_type, public.withdrawal_method_type, public.chat_request_status, public.report_status, public.transaction_type;
DROP FUNCTION IF EXISTS public.handle_new_user, public.create_sell_order, public.create_buy_order, public.approve_buy_order, public.reject_buy_order, public.cancel_remaining_sell_order, public.claim_daily_reward, public.claim_newbie_friend_rewards, admin_update_user_balance, admin_update_user_hold_balance;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Recreate custom ENUM types
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'pending_confirmation', 'in_applied', 'completed', 'cancelled', 'failed');
CREATE TYPE public.sell_order_status AS ENUM ('pending', 'partially_filled', 'processing', 'completed', 'failed', 'cancel_requested');
CREATE TYPE public.payment_type AS ENUM ('bank', 'upi', 'usdt', 'p2p_upi', 'p2p_bank');
CREATE TYPE public.withdrawal_method_type AS ENUM ('upi', 'bank');
CREATE TYPE public.chat_request_status AS ENUM ('pending', 'active', 'closed');
CREATE TYPE public.report_status AS ENUM ('pending', 'resolved');
CREATE TYPE public.transaction_type AS ENUM ('team_bonus', 'daily_task', 'new_user_reward', 'buy_order_credit', 'sell_order_debit', 'sell_order_refund');

-- 3. Create the tables
-- Users Table
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    numeric_id text UNIQUE,
    email text UNIQUE,
    phone_number text UNIQUE,
    display_name text,
    photo_url text,
    balance numeric(10, 2) DEFAULT 0.00,
    hold_balance numeric(10, 2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now(),
    inviter_uid uuid REFERENCES public.users(id),
    claimed_user_rewards text[],
    payment_methods jsonb,
    session_id text,
    claimed_newbie_friend_rewards text[]
);
COMMENT ON TABLE public.users IS 'Stores public profile information for each user.';

-- Payment Methods Table (for Admin)
CREATE TABLE public.payment_methods (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type public.payment_type NOT NULL,
    bank_name text,
    account_holder_name text,
    account_number text,
    ifsc_code text,
    upi_holder_name text,
    upi_id text,
    usdt_wallet_address text,
    is_active boolean DEFAULT true,
    provider text,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.payment_methods IS 'Stores admin-configured payment methods for receiving payments.';

-- Buy Orders Table
CREATE TABLE public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    order_id text UNIQUE,
    amount numeric NOT NULL,
    base_amount numeric,
    bonus_percentage numeric,
    payment_type public.payment_type,
    payment_provider text,
    admin_payment_method_id bigint REFERENCES public.payment_methods(id),
    seller_id uuid,
    seller_withdrawal_details jsonb,
    matched_sell_order_id bigint,
    status public.order_status DEFAULT 'pending_payment',
    cancellation_reason text,
    rejection_reason text,
    utr text,
    screenshot_url text,
    created_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    ocr_amount_match boolean,
    ocr_utr_match boolean,
    ocr_upi_match boolean,
    ocr_name_match boolean,
    ocr_date_match boolean,
    ocr_status_match boolean,
    ocr_raw_text text
);
COMMENT ON TABLE public.orders IS 'Stores user buy orders for LGB.';

-- Sell Orders Table
CREATE TABLE public.sell_orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    order_id text UNIQUE,
    amount numeric NOT NULL,
    remaining_amount numeric NOT NULL,
    withdrawal_method jsonb NOT NULL,
    status public.sell_order_status DEFAULT 'pending',
    matched_buy_orders jsonb,
    utr text,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);
COMMENT ON TABLE public.sell_orders IS 'Stores user sell orders, forming the P2P liquidity pool.';

-- Transactions Table
CREATE TABLE public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    order_id text,
    amount numeric NOT NULL,
    description text,
    type public.transaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Stores miscellaneous user transactions, like rewards.';

-- Chat Requests Table
CREATE TABLE public.chat_requests (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    user_numeric_id text,
    entered_identifier text NOT NULL,
    status public.chat_request_status DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    chat_history jsonb,
    agent_id text,
    agent_joined_at timestamp with time zone
);
COMMENT ON TABLE public.chat_requests IS 'Stores user requests for live agent support.';

-- Reports Table
CREATE TABLE public.reports (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    case_id text UNIQUE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    user_numeric_id text,
    order_id text,
    display_order_id text,
    order_type text,
    problem_type text NOT NULL,
    message text NOT NULL,
    screenshot_url text,
    video_url text,
    created_at timestamp with time zone DEFAULT now(),
    status public.report_status DEFAULT 'pending',
    resolution_message text
);
COMMENT ON TABLE public.reports IS 'Stores user-submitted problem reports.';

-- Feedback Table
CREATE TABLE public.feedback (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    user_numeric_id text,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.feedback IS 'Stores user-submitted feedback.';

-- Daily Rewards Table
CREATE TABLE public.daily_rewards (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    date date NOT NULL,
    claimed_task_ids text[],
    UNIQUE(user_id, date)
);
COMMENT ON TABLE public.daily_rewards IS 'Tracks daily rewards claimed by a user.';

-- 4. Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
-- USERS Table Policies
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- PAYMENT_METHODS (Admin) Table Policies
CREATE POLICY "Allow admin read access to payment methods" ON public.payment_methods FOR SELECT USING (true); -- In a real app, you'd check for an admin role.

-- ORDERS Table Policies
CREATE POLICY "Allow user to manage their own buy orders" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- SELL_ORDERS Table Policies
CREATE POLICY "Allow user to manage their own sell orders" ON public.sell_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated to read sell orders" ON public.sell_orders FOR SELECT TO authenticated USING (true);

-- TRANSACTIONS Table Policies
CREATE POLICY "Allow user to read their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- CHAT_REQUESTS Table Policies
CREATE POLICY "Allow user to manage their own chat requests" ON public.chat_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow anonymous users to create chat requests" ON public.chat_requests FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- REPORTS Table Policies
CREATE POLICY "Allow user to manage their own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);

-- FEEDBACK Table Policies
CREATE POLICY "Allow user to submit feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DAILY_REWARDS Table Policies
CREATE POLICY "Allow user to manage their own daily rewards" ON public.daily_rewards FOR ALL USING (auth.uid() = user_id);

-- 6. Define Database Functions (RPC)
-- Function to create a user profile automatically on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, numeric_id, display_name, photo_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    floor(10000000 + random() * 90000000)::text,
    'User' || substr(new.raw_user_meta_data->>'phone', -4),
    'https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224703_814.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwM184MTQuanBnIiwiaWF0IjoxNzc1MTUwMzMxLCJleHAiOjE4MDY2ODYzMzF9.o5z7uxui9h2o-GVKG9znk4TKBAoK4WMsLKY6NPZ8_1o'
  );
  RETURN new;
END;
$$;

-- Trigger for the new user function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to create a sell order
CREATE OR REPLACE FUNCTION public.create_sell_order(
    p_user_id uuid,
    p_amount numeric,
    p_withdrawal_method jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance numeric;
BEGIN
    SELECT balance INTO current_balance FROM public.users WHERE id = p_user_id;

    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    UPDATE public.users SET balance = balance - p_amount WHERE id = p_user_id;

    INSERT INTO public.sell_orders (user_id, amount, remaining_amount, withdrawal_method, order_id)
    VALUES (p_user_id, p_amount, p_amount, p_withdrawal_method, 'LGPAYS' || substr(md5(random()::text), 0, 15));

    INSERT INTO public.transactions (user_id, amount, description, type, order_id)
    VALUES (p_user_id, p_amount, 'Sell order placed', 'sell_order_debit', (SELECT order_id FROM public.sell_orders WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1));
END;
$$;

-- Function to create a buy order
CREATE OR REPLACE FUNCTION public.create_buy_order(
    p_user_id uuid,
    p_amount numeric,
    p_base_amount numeric,
    p_bonus_percentage numeric,
    p_payment_provider text,
    p_payment_type public.payment_type
)
RETURNS TABLE(order_id text, final_payment_type public.payment_type)
LANGUAGE plpgsql
AS $$
DECLARE
    matched_seller record;
    new_order_id text;
    final_type public.payment_type := p_payment_type;
BEGIN
    new_order_id := 'LGPAYB' || substr(md5(random()::text), 0, 15);

    SELECT * INTO matched_seller
    FROM public.sell_orders
    WHERE status IN ('pending', 'partially_filled')
      AND user_id != p_user_id
      AND remaining_amount >= p_base_amount
    ORDER BY created_at
    LIMIT 1;

    IF matched_seller IS NOT NULL THEN
        final_type := 'p2p_upi';
        INSERT INTO public.orders (user_id, order_id, amount, base_amount, bonus_percentage, payment_provider, payment_type, seller_id, seller_withdrawal_details, matched_sell_order_id)
        VALUES (p_user_id, new_order_id, p_amount, p_base_amount, p_bonus_percentage, p_payment_provider, final_type, matched_seller.user_id, matched_seller.withdrawal_method, matched_seller.id);
    ELSE
        INSERT INTO public.orders (user_id, order_id, amount, base_amount, bonus_percentage, payment_provider, payment_type)
        VALUES (p_user_id, new_order_id, p_amount, p_base_amount, p_bonus_percentage, p_payment_provider, p_payment_type);
    END IF;

    RETURN QUERY SELECT new_order_id, final_type;
END;
$$;

-- Function to approve a buy order
CREATE OR REPLACE FUNCTION public.approve_buy_order(
    p_order_id bigint,
    p_user_id uuid,
    p_amount_to_add numeric,
    p_matched_sell_order_id bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sell_order_user_id uuid;
    sell_order_remaining_amount numeric;
BEGIN
    UPDATE public.orders SET status = 'completed' WHERE id = p_order_id;
    UPDATE public.users SET balance = balance + p_amount_to_add WHERE id = p_user_id;
    INSERT INTO public.transactions (user_id, amount, description, type) VALUES (p_user_id, p_amount_to_add, 'Buy order completed', 'buy_order_credit');
    IF p_matched_sell_order_id IS NOT NULL THEN
        SELECT user_id, remaining_amount INTO sell_order_user_id, sell_order_remaining_amount
        FROM public.sell_orders WHERE id = p_matched_sell_order_id;
        UPDATE public.sell_orders
        SET remaining_amount = remaining_amount - p_base_amount, status = CASE WHEN (remaining_amount - p_base_amount) <= 0 THEN 'completed' ELSE 'partially_filled' END
        WHERE id = p_matched_sell_order_id;
    END IF;
END;
$$;

-- Function to reject a buy order
CREATE OR REPLACE FUNCTION public.reject_buy_order(p_order_id bigint, p_rejection_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.orders SET status = 'failed', rejection_reason = p_rejection_reason WHERE id = p_order_id;
END;
$$;

-- Function to cancel remaining sell order
CREATE OR REPLACE FUNCTION public.cancel_remaining_sell_order(p_order_id bigint, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rem_amount numeric;
BEGIN
    SELECT remaining_amount INTO rem_amount FROM public.sell_orders WHERE id = p_order_id AND user_id = p_user_id;
    UPDATE public.sell_orders SET status = 'completed', remaining_amount = 0, failure_reason = 'Partially cancelled by user' WHERE id = p_order_id;
    IF rem_amount > 0 THEN
        UPDATE public.users SET balance = balance + rem_amount WHERE id = p_user_id;
        INSERT INTO public.transactions (user_id, amount, description, type, order_id)
        VALUES (p_user_id, rem_amount, 'Partial sell order cancelled and refunded', 'sell_order_refund', (SELECT order_id FROM public.sell_orders WHERE id = p_order_id));
    END IF;
END;
$$;

-- Function to claim daily rewards
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id uuid, p_task_id text, p_reward_amount numeric, p_date_string text, p_task_title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE today_date date := p_date_string::date;
BEGIN
    IF EXISTS (SELECT 1 FROM public.daily_rewards WHERE user_id = p_user_id AND date = today_date AND p_task_id = ANY(claimed_task_ids)) THEN
        RAISE EXCEPTION 'Reward for this task has already been claimed today.';
    END IF;
    UPDATE public.users SET balance = balance + p_reward_amount WHERE id = p_user_id;
    INSERT INTO public.transactions (user_id, amount, description, type, order_id)
    VALUES (p_user_id, p_reward_amount, p_task_title, 'daily_task', 'TASK-' || p_task_id);
    INSERT INTO public.daily_rewards (user_id, date, claimed_task_ids)
    VALUES (p_user_id, today_date, ARRAY[p_task_id])
    ON CONFLICT (user_id, date)
    DO UPDATE SET claimed_task_ids = array_append(public.daily_rewards.claimed_task_ids, p_task_id);
END;
$$;

-- Function to claim newbie friend rewards
CREATE OR REPLACE FUNCTION public.claim_newbie_friend_rewards(p_user_id uuid, p_friend_uids uuid[], p_reward_amount numeric, p_reward_description text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE total_reward numeric := array_length(p_friend_uids, 1) * p_reward_amount;
BEGIN
    UPDATE public.users SET balance = balance + total_reward WHERE id = p_user_id;
    INSERT INTO public.transactions (user_id, amount, description, type)
    VALUES (p_user_id, total_reward, p_reward_description, 'team_bonus');
    UPDATE public.users SET claimed_newbie_friend_rewards = array_cat(claimed_newbie_friend_rewards, p_friend_uids) WHERE id = p_user_id;
END;
$$;

-- Admin-specific RPC functions
CREATE OR REPLACE FUNCTION admin_update_user_balance(target_user_id uuid, new_balance numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET balance = new_balance WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_user_hold_balance(target_user_id uuid, new_balance numeric, new_hold_balance numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET balance = new_balance, hold_balance = new_hold_balance WHERE id = target_user_id;
END;
$$;
    