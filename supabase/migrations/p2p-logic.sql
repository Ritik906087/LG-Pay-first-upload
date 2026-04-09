-- Supabase migration to set up the P2P trading engine.
-- This script should be run in the Supabase SQL Editor.
-- It is idempotent and can be run multiple times safely.

-- ============[ 1. ENUM TYPE MIGRATION ]============
-- Supabase doesn't support ALTER ENUM directly in a simple way.
-- The recommended way is to create a new type, update the table, drop the old type, and rename the new one.
DO $$
BEGIN
    -- Create the new order_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_new') THEN
        CREATE TYPE public.order_status_new AS ENUM (
            'pending_payment',
            'pending_confirmation',
            'in_applied',
            'completed',
            'cancelled',
            'failed'
        );
    END IF;

    -- Create the new sell_order_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sell_order_status_new') THEN
        CREATE TYPE public.sell_order_status_new AS ENUM (
            'pending',
            'partially_filled',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'cancel_requested'
        );
    END IF;

    -- Alter table columns to use the new enums, only if the current type is different
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') != 'order_status_new' THEN
        ALTER TABLE public.orders ALTER COLUMN status TYPE public.order_status_new USING status::text::order_status_new;
    END IF;
     IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'sell_orders' AND column_name = 'status') != 'sell_order_status_new' THEN
        ALTER TABLE public.sell_orders ALTER COLUMN status TYPE public.sell_order_status_new USING status::text::sell_order_status_new;
    END IF;

    -- Drop the old enums if they exist and are not used by the tables anymore
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        DROP TYPE public.order_status;
    END IF;
    ALTER TYPE public.order_status_new RENAME TO order_status;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sell_order_status') THEN
        DROP TYPE public.sell_order_status;
    END IF;
    ALTER TYPE public.sell_order_status_new RENAME TO sell_order_status;

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Types already exist or have been renamed, skipping creation/rename.';
    WHEN others THEN
        RAISE EXCEPTION 'An unexpected error occurred during enum migration: %', SQLERRM;
END;
$$;


-- ============[ 2. SCHEMA CHANGES ]============
-- Add columns to 'orders' for P2P matching if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='seller_id') THEN
        ALTER TABLE public.orders ADD COLUMN seller_id UUID REFERENCES public.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='seller_withdrawal_details') THEN
        ALTER TABLE public.orders ADD COLUMN seller_withdrawal_details JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='matched_sell_order_id') THEN
        ALTER TABLE public.orders ADD COLUMN matched_sell_order_id TEXT;
    END IF;
END;
$$;

-- Add columns to 'sell_orders' if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sell_orders' AND column_name='matched_buy_orders') THEN
        ALTER TABLE public.sell_orders ADD COLUMN matched_buy_orders JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sell_orders' AND column_name='remaining_amount') THEN
        ALTER TABLE public.sell_orders ADD COLUMN remaining_amount NUMERIC NOT NULL DEFAULT 0;
    END IF;
END;
$$;


-- ============[ 3. FUNCTIONS & LOGIC ]============

-- Function to create a sell order and reserve funds
CREATE OR REPLACE FUNCTION public.create_sell_order(
    p_user_id uuid,
    p_amount numeric,
    p_withdrawal_method jsonb
)
RETURNS TABLE (
  id bigint,
  order_id text,
  user_id uuid,
  amount numeric,
  remaining_amount numeric,
  status sell_order_status,
  withdrawal_method jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_balance numeric;
    new_order public.sell_orders;
BEGIN
    -- Check user balance
    SELECT balance INTO user_balance FROM public.users WHERE public.users.id = p_user_id;
    IF user_balance IS NULL OR user_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Reserve funds
    UPDATE public.users
    SET
        balance = balance - p_amount,
        hold_balance = hold_balance + p_amount
    WHERE public.users.id = p_user_id;

    -- Create sell order
    INSERT INTO public.sell_orders (user_id, amount, remaining_amount, withdrawal_method, status, order_id)
    VALUES (p_user_id, p_amount, p_amount, p_withdrawal_method, 'pending', 'SELL-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12))
    RETURNING * INTO new_order;

    RETURN QUERY SELECT new_order.id, new_order.order_id, new_order.user_id, new_order.amount, new_order.remaining_amount, new_order.status, new_order.withdrawal_method, new_order.created_at;
END;
$$;


-- Function to match a buyer with a seller (P2P) or fallback to admin
CREATE OR REPLACE FUNCTION public.match_buy_order(
    p_buyer_id uuid,
    p_amount numeric,
    p_payment_provider text
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    seller_record RECORD;
    new_buy_order public.orders;
    new_buy_order_json json;
    match_info jsonb;
BEGIN
    -- 1. Find the oldest available seller (FIFO)
    SELECT *
    INTO seller_record
    FROM public.sell_orders
    WHERE status IN ('pending', 'partially_filled')
      AND remaining_amount >= p_amount -- Match only if seller has enough
      AND user_id != p_buyer_id -- Cannot trade with oneself
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE; -- Lock the row to prevent race conditions

    -- 2. If a seller is found, create a P2P buy order
    IF FOUND THEN
        -- Create the buy order linked to the seller
        INSERT INTO public.orders (
            user_id, amount, base_amount, bonus_percentage, payment_provider,
            payment_type, status, seller_id, seller_withdrawal_details,
            matched_sell_order_id, order_id
        )
        VALUES (
            p_buyer_id, p_amount + (p_amount * 0.06), p_amount, 6, p_payment_provider,
            'p2p_upi', 'pending_payment', seller_record.user_id, seller_record.withdrawal_method,
            seller_record.id::text, 'BUY-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
        )
        RETURNING * INTO new_buy_order;

        -- Update the sell order
        UPDATE public.sell_orders
        SET
            remaining_amount = remaining_amount - p_amount,
            status = CASE
                        WHEN (remaining_amount - p_amount) < 1 THEN 'processing'
                        ELSE 'partially_filled'
                     END,
            matched_buy_orders = matched_buy_orders || jsonb_build_object(
                'buy_order_id', new_buy_order.id,
                'buyer_id', p_buyer_id,
                'amount', p_amount,
                'status', 'pending_payment',
                'created_at', new_buy_order.created_at
            )
        WHERE id = seller_record.id;

        match_info := jsonb_build_object('type', 'p2p_match', 'buy_order', row_to_json(new_buy_order));

    -- 3. If no seller is found, create a regular order (fallback to admin)
    ELSE
        INSERT INTO public.orders (
            user_id, amount, base_amount, bonus_percentage, payment_provider,
            payment_type, status, order_id
        )
        VALUES (
            p_buyer_id, p_amount + (p_amount * 0.06), p_amount, 6, p_payment_provider,
            'upi', 'pending_payment', 'BUY-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
        )
        RETURNING * INTO new_buy_order;

        match_info := jsonb_build_object('type', 'admin_fallback', 'buy_order', row_to_json(new_buy_order));
    END IF;

    RETURN match_info;
END;
$$;


-- Function to restore seller's amount when a buy order fails
CREATE OR REPLACE FUNCTION public.restore_sell_order_on_failed_buy(
    p_sell_order_id bigint,
    p_buy_order_id bigint,
    p_amount_to_restore numeric
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    seller_order public.sell_orders;
    updated_matched_orders jsonb;
    i jsonb;
BEGIN
    SELECT * INTO seller_order FROM public.sell_orders WHERE id = p_sell_order_id FOR UPDATE;

    IF FOUND THEN
        updated_matched_orders := '[]'::jsonb;
        FOR i IN SELECT * FROM jsonb_array_elements(seller_order.matched_buy_orders)
        LOOP
            IF (i->>'buy_order_id')::bigint != p_buy_order_id THEN
                updated_matched_orders := updated_matched_orders || i;
            END IF;
        END LOOP;

        UPDATE public.sell_orders
        SET
            remaining_amount = remaining_amount + p_amount_to_restore,
            status = CASE
                        WHEN seller_order.status = 'processing' THEN 'partially_filled'
                        WHEN (remaining_amount + p_amount_to_restore) >= seller_order.amount THEN 'pending'
                        WHEN seller_order.status = 'cancel_requested' AND jsonb_array_length(updated_matched_orders) > 0 THEN 'cancel_requested'
                        WHEN seller_order.status = 'cancel_requested' AND jsonb_array_length(updated_matched_orders) = 0 THEN 'pending'
                        ELSE 'partially_filled'
                     END,
            matched_buy_orders = updated_matched_orders
        WHERE id = p_sell_order_id;
    END IF;
END;
$$;

-- Function for a buyer to cancel their order
CREATE OR REPLACE FUNCTION public.cancel_buy_order(p_order_id bigint, p_cancellation_reason text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    buy_order public.orders;
BEGIN
    UPDATE public.orders
    SET status = 'cancelled', cancellation_reason = p_cancellation_reason
    WHERE id = p_order_id
    RETURNING * INTO buy_order;

    IF buy_order.payment_type = 'p2p_upi' AND buy_order.matched_sell_order_id IS NOT NULL THEN
        PERFORM public.restore_sell_order_on_failed_buy(
            buy_order.matched_sell_order_id::bigint,
            p_order_id,
            buy_order.base_amount
        );
    END IF;
END;
$$;


-- Function for an admin to reject a payment
CREATE OR REPLACE FUNCTION public.reject_buy_order(p_order_id bigint, p_rejection_reason text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    buy_order public.orders;
BEGIN
    UPDATE public.orders
    SET status = 'failed', rejection_reason = p_rejection_reason
    WHERE id = p_order_id
    RETURNING * INTO buy_order;

    IF buy_order.payment_type = 'p2p_upi' AND buy_order.matched_sell_order_id IS NOT NULL THEN
        PERFORM public.restore_sell_order_on_failed_buy(
            buy_order.matched_sell_order_id::bigint,
            p_order_id,
            buy_order.base_amount
        );
    END IF;
END;
$$;


-- Main approval logic
CREATE OR REPLACE FUNCTION public.approve_buy_order(
    p_order_id bigint,
    p_user_id uuid,
    p_amount_to_add numeric
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    buy_order public.orders;
    seller_order public.sell_orders;
    updated_matched_orders jsonb;
    all_completed boolean := true;
    i jsonb;
BEGIN
    UPDATE public.orders SET status = 'completed' WHERE id = p_order_id RETURNING * INTO buy_order;
    UPDATE public.users SET balance = balance + p_amount_to_add WHERE id = p_user_id;

    IF buy_order.payment_type = 'p2p_upi' AND buy_order.matched_sell_order_id IS NOT NULL THEN
        SELECT * INTO seller_order FROM public.sell_orders WHERE id = buy_order.matched_sell_order_id::bigint FOR UPDATE;

        updated_matched_orders := '[]'::jsonb;
        FOR i IN SELECT * FROM jsonb_array_elements(seller_order.matched_buy_orders)
        LOOP
            IF (i->>'buy_order_id')::bigint = p_order_id THEN
                updated_matched_orders := updated_matched_orders || jsonb_set(i, '{status}', '"completed"');
            ELSE
                updated_matched_orders := updated_matched_orders || i;
                IF i->>'status' != 'completed' THEN all_completed := false; END IF;
            END IF;
        END LOOP;

        UPDATE public.sell_orders
        SET
            matched_buy_orders = updated_matched_orders,
            status = CASE
                        WHEN all_completed AND remaining_amount < 1 THEN 'completed'
                        ELSE status
                     END
        WHERE id = seller_order.id;

        UPDATE public.users SET hold_balance = hold_balance - buy_order.base_amount WHERE id = seller_order.user_id;
    END IF;

    INSERT INTO public.transactions(user_id, order_id, amount, description, type)
    VALUES (p_user_id, buy_order.order_id, p_amount_to_add, 'Buy order completed', 'buy');
END;
$$;

-- Function for a seller to cancel the remaining part of their order
CREATE OR REPLACE FUNCTION public.cancel_remaining_sell_order(p_order_id bigint, p_user_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sell_order_data RECORD;
    has_pending_matches BOOLEAN := FALSE;
    amount_to_refund NUMERIC;
BEGIN
    SELECT * INTO sell_order_data FROM public.sell_orders WHERE id = p_order_id AND user_id = p_user_id FOR UPDATE;

    IF NOT FOUND OR sell_order_data.status IN ('completed', 'failed', 'cancelled') THEN
        RAISE EXCEPTION 'Order cannot be cancelled.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(sell_order_data.matched_buy_orders) AS item
        WHERE item->>'status' IN ('pending_payment', 'pending_confirmation', 'in_applied')
    ) INTO has_pending_matches;

    amount_to_refund := sell_order_data.remaining_amount;

    IF amount_to_refund > 0 THEN
        UPDATE public.users
        SET
            balance = balance + amount_to_refund,
            hold_balance = hold_balance - amount_to_refund
        WHERE id = p_user_id;
    END IF;

    UPDATE public.sell_orders
    SET
        remaining_amount = 0,
        status = CASE
            WHEN has_pending_matches THEN 'cancel_requested'::sell_order_status
            ELSE 'cancelled'::sell_order_status
        END
    WHERE id = p_order_id;
END;
$$;
