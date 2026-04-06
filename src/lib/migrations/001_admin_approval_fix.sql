-- This script is designed to be run in the Supabase SQL Editor.
-- It adds missing columns and functions required for the admin approval flow to work correctly.
-- It is safe to run and will not delete any existing data.

-- 1. Add missing columns to the 'orders' table if they don't exist.
-- This makes the table compatible with the latest P2P and admin approval logic.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS matched_sell_order_id UUID REFERENCES public.sell_orders(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 2. Add missing columns to the 'sell_orders' table if they don't exist.
ALTER TABLE public.sell_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.sell_orders ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 3. Create or replace the core 'approve_buy_order' function.
-- This server-side function handles the logic for approving a payment,
-- crediting the user's wallet, and updating P2P sell orders.
CREATE OR REPLACE FUNCTION public.approve_buy_order(p_order_id uuid, p_user_id uuid, p_amount_to_add numeric, p_matched_sell_order_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sell_order_seller_id UUID;
  v_sell_order_amount NUMERIC;
  v_buy_order_base_amount NUMERIC;
  v_new_remaining_amount NUMERIC;
BEGIN
  -- Update the buyer's wallet balance
  UPDATE public.users
  SET balance = balance + p_amount_to_add
  WHERE id = p_user_id;

  -- The frontend now handles the optimistic update to 'completed'.
  -- This function ensures the backend logic for P2P is solid.
  
  -- If it's a P2P transaction, update the corresponding sell order
  IF p_matched_sell_order_id IS NOT NULL THEN
    -- Get the base amount of the buy order to subtract from the sell order
    SELECT base_amount INTO v_buy_order_base_amount
    FROM public.orders
    WHERE id = p_order_id;

    -- Atomically update the sell order's remaining amount and get key details
    UPDATE public.sell_orders
    SET remaining_amount = remaining_amount - v_buy_order_base_amount
    WHERE id = p_matched_sell_order_id
    RETURNING remaining_amount, user_id, amount INTO v_new_remaining_amount, v_sell_order_seller_id, v_sell_order_amount;

    -- Update the sell order status based on the new remaining amount
    IF v_new_remaining_amount <= 0 THEN
      UPDATE public.sell_orders
      SET status = 'completed', completed_at = now(), remaining_amount = 0
      WHERE id = p_matched_sell_order_id;
      
      -- Since the sell order is fully complete, move the seller's funds from hold to main balance.
      UPDATE public.users
      SET 
        hold_balance = hold_balance - v_sell_order_amount,
        balance = balance + v_sell_order_amount
      WHERE id = v_sell_order_seller_id;
      
    ELSE
      -- If there's still amount remaining, it's partially filled
      UPDATE public.sell_orders
      SET status = 'partially_filled'
      WHERE id = p_matched_sell_order_id;
    END IF;
  END IF;
END;
$$;


-- 4. Create or replace other related P2P functions to ensure full system compatibility.

-- Function to create a new sell order and put the user's balance on hold.
CREATE OR REPLACE FUNCTION public.create_sell_order(p_user_id uuid, p_amount numeric, p_withdrawal_method jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Deduct the amount from the user's main balance and add to hold balance
  UPDATE public.users
  SET 
    balance = balance - p_amount,
    hold_balance = hold_balance + p_amount
  WHERE id = p_user_id AND balance >= p_amount;

  -- 2. Create the new sell order if balance was sufficient
  IF FOUND THEN
    INSERT INTO public.sell_orders (user_id, order_id, amount, remaining_amount, withdrawal_method, status, created_at)
    VALUES (
      p_user_id,
      'LGPAYSELL' || substr(md5(random()::text), 0, 15),
      p_amount,
      p_amount,
      p_withdrawal_method,
      'pending',
      now()
    );
  ELSE
    RAISE EXCEPTION 'Insufficient balance to create sell order.';
  END IF;
END;
$$;


-- Function to cancel the remaining, unmatched portion of a sell order.
CREATE OR REPLACE FUNCTION public.cancel_remaining_sell_order(p_order_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining_amount NUMERIC;
BEGIN
  -- Get the remaining amount and ensure the user owns the order
  SELECT remaining_amount INTO v_remaining_amount
  FROM public.sell_orders
  WHERE id = p_order_id AND user_id = p_user_id;

  -- If there is a remaining amount, refund it and update the order
  IF v_remaining_amount > 0 THEN
    -- Refund the amount from hold balance back to main balance
    UPDATE public.users
    SET 
      balance = balance + v_remaining_amount,
      hold_balance = hold_balance - v_remaining_amount
    WHERE id = p_user_id;

    -- Mark the order as failed/cancelled
    UPDATE public.sell_orders
    SET 
      status = 'failed',
      failure_reason = 'Manually cancelled by user',
      remaining_amount = 0
    WHERE id = p_order_id;
  END IF;
END;
$$;


-- Function to claim daily rewards.
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id uuid, p_task_id text, p_reward_amount numeric, p_date_string text, p_task_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add reward to user's balance
  UPDATE public.users
  SET balance = balance + p_reward_amount
  WHERE id = p_user_id;

  -- Record the claimed task for the specific day
  INSERT INTO public.daily_rewards (user_id, date, claimed_task_ids)
  VALUES (p_user_id, p_date_string::date, ARRAY[p_task_id])
  ON CONFLICT (user_id, date) DO UPDATE
  SET claimed_task_ids = array_append(daily_rewards.claimed_task_ids, p_task_id);

  -- Add a record to the transactions table
  INSERT INTO public.transactions (user_id, amount, description, type, order_id)
  VALUES (p_user_id, p_reward_amount, p_task_title, 'daily_task', 'TASK-' || p_task_id || '-' || p_date_string);
END;
$$;
