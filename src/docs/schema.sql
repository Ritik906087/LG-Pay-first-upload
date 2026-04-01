
-- #################################################################
-- #############           TABLE DEFINITIONS           #############
-- #################################################################

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.chat_requests CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.sell_orders CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.qr_payments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- Create the users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    numeric_id TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT,
    display_name TEXT,
    photo_url TEXT,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    hold_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    inviter_uid UUID REFERENCES public.users(id),
    claimed_user_rewards TEXT[],
    payment_methods JSONB,
    session_id TEXT
);

-- Create the orders table
CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    order_id TEXT UNIQUE,
    amount NUMERIC(10, 2),
    base_amount NUMERIC(10, 2),
    bonus_percentage NUMERIC(5, 2),
    payment_type TEXT,
    payment_provider TEXT,
    status TEXT,
    utr TEXT,
    screenshot_url TEXT,
    cancellation_reason TEXT,
    rejection_reason TEXT,
    verification_result TEXT,
    admin_payment_method_id BIGINT,
    seller_id BIGINT,
    seller_withdrawal_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    matched_sell_order_path TEXT,
    ocr_verified BOOLEAN,
    ocr_utr_match BOOLEAN,
    ocr_amount_match BOOLEAN,
    ocr_upi_match BOOLEAN,
    ocr_bank_account_match BOOLEAN
);

-- Create the sell_orders table
CREATE TABLE public.sell_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    user_numeric_id TEXT,
    user_phone_number TEXT,
    order_id TEXT UNIQUE,
    amount NUMERIC(10, 2),
    remaining_amount NUMERIC(10, 2),
    status TEXT,
    withdrawal_method JSONB,
    matched_buy_orders JSONB,
    utr TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create the transactions table
CREATE TABLE public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    order_id TEXT,
    amount NUMERIC(10, 2),
    description TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the payment_methods table (for admin)
CREATE TABLE public.payment_methods (
    id BIGSERIAL PRIMARY KEY,
    type TEXT,
    bank_name TEXT,
    account_holder_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_holder_name TEXT,
    upi_id TEXT,
    usdt_wallet_address TEXT
);

-- Create chat_requests table
CREATE TABLE public.chat_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    user_numeric_id TEXT,
    entered_identifier TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    chat_history JSONB,
    agent_id TEXT,
    agent_joined_at TIMESTAMPTZ
);

-- Create reports table
CREATE TABLE public.reports (
    id BIGSERIAL PRIMARY KEY,
    case_id TEXT UNIQUE,
    user_id UUID REFERENCES public.users(id),
    user_numeric_id TEXT,
    order_id TEXT,
    display_order_id TEXT,
    order_type TEXT,
    problem_type TEXT,
    message TEXT,
    screenshot_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    resolution_message TEXT
);

-- Create feedback table
CREATE TABLE public.feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    user_numeric_id TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create qr_payments table (from api/create-qr/route.ts)
CREATE TABLE public.qr_payments (
    id TEXT PRIMARY KEY,
    status TEXT,
    created_at TIMESTAMPTZ,
    paid BOOLEAN DEFAULT false,
    user_id UUID REFERENCES public.users(id),
    method_name TEXT,
    payer_vpa TEXT,
    razorpay_payment_id TEXT,
    paid_at TIMESTAMPTZ,
    amount NUMERIC
);


-- #################################################################
-- #############      ROW LEVEL SECURITY (RLS)         #############
-- #################################################################

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_payments ENABLE ROW LEVEL SECURITY;

-- Policies for 'users' table
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Public user data is viewable by everyone." ON public.users FOR SELECT USING (true);


-- Policies for 'orders' table
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending orders." ON public.orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_payment') WITH CHECK (auth.uid() = user_id);

-- Policies for 'sell_orders' table
CREATE POLICY "Users can view their own sell orders." ON public.sell_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sell orders." ON public.sell_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel their own pending sell orders." ON public.sell_orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);


-- Policies for 'transactions' table
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'payment_methods' (Admin methods)
CREATE POLICY "Authenticated users can view payment methods." ON public.payment_methods FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'chat_requests'
CREATE POLICY "Anyone can create a chat request." ON public.chat_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own chat requests." ON public.chat_requests FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'reports'
CREATE POLICY "Users can create their own reports." ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reports." ON public.reports FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'feedback'
CREATE POLICY "Authenticated users can submit feedback." ON public.feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for 'qr_payments'
CREATE POLICY "Users can view their own QR payments." ON public.qr_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own QR payments." ON public.qr_payments FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Policies for service_role (admin)
CREATE POLICY "Enable all access for service_role on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on sell_orders" ON public.sell_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on chat_requests" ON public.chat_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on feedback" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on qr_payments" ON public.qr_payments FOR ALL USING (true) WITH CHECK (true);


-- #################################################################
-- #############         DATABASE FUNCTIONS (RPC)        #############
-- #################################################################

CREATE OR REPLACE FUNCTION public.manage_hold_balance(p_user_id uuid, p_amount numeric, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_balance NUMERIC;
  current_hold_balance NUMERIC;
BEGIN
  -- Get current balances within a transaction lock
  SELECT balance, hold_balance INTO current_balance, current_hold_balance FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF p_action = 'add' THEN
    IF current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient main balance to move to hold.';
    END IF;
    
    UPDATE public.users
    SET
      balance = balance - p_amount,
      hold_balance = hold_balance + p_amount
    WHERE id = p_user_id;

  ELSIF p_action = 'remove' THEN
    IF current_hold_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient hold balance to move to main.';
    END IF;

    UPDATE public.users
    SET
      balance = balance + p_amount,
      hold_balance = hold_balance - p_amount
    WHERE id = p_user_id;

  ELSE
    RAISE EXCEPTION 'Invalid action. Must be ''add'' or ''remove''.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sell_order(
    p_user_id uuid,
    p_amount numeric,
    p_withdrawal_method jsonb,
    p_user_numeric_id text,
    p_user_phone_number text
)
RETURNS void AS $$
declare
  user_balance numeric;
  new_order_id text;
begin
  -- Get user's balance and lock the row
  select balance into user_balance from public.users where id = p_user_id for update;

  if not found then
    raise exception 'User not found';
  end if;

  if user_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Decrement user's balance
  update public.users
  set balance = balance - p_amount
  where id = p_user_id;

  -- Generate a unique order ID
  new_order_id := 'LGPAYS' || to_char(now(), 'YYYYMMDDHH24MISS') || (abs(hashtext(p_user_id::text)) % 1000)::text;

  -- Insert the new sell order
  insert into public.sell_orders (
    user_id,
    order_id,
    amount,
    remaining_amount,
    status,
    withdrawal_method,
    user_numeric_id,
    user_phone_number
  ) values (
    p_user_id,
    new_order_id,
    p_amount,
    p_amount, -- Initially, remaining amount is the full amount
    'pending',
    p_withdrawal_method,
    p_user_numeric_id,
    p_user_phone_number
  );
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.create_buy_order(
    p_user_id uuid,
    p_amount numeric,
    p_base_amount numeric,
    p_bonus_percentage numeric,
    p_payment_provider text,
    p_payment_type text
)
RETURNS TABLE (order_id text, final_payment_type text) AS $$
declare
  new_order_id text;
  v_final_payment_type text := p_payment_type;
  seller_record record;
  p2p_threshold numeric := 5000;
begin
  -- Generate a unique order ID
  new_order_id := 'LGPAYB' || to_char(now(), 'YYYYMMDDHH24MISS') || (abs(hashtext(p_user_id::text)) % 1000)::text;

  -- This P2P logic is currently simplified.
  -- A full implementation would need to handle more edge cases.
  if (p_payment_type = 'upi' or p_payment_type = 'bank') and p_base_amount >= p2p_threshold then
    -- Find a pending sell order that can fulfill this buy order
    select * into seller_record
    from public.sell_orders
    where
      status in ('pending', 'partially_filled')
      and remaining_amount >= p_base_amount
      and user_id != p_user_id -- Can't match with self
    order by created_at asc
    limit 1
    for update;

    -- If a seller is found, convert to P2P and update sell order
    if found then
      v_final_payment_type := 'p2p_' || p_payment_type;

      -- Create the buy order as a P2P order
      insert into public.orders (
        user_id, order_id, amount, base_amount, bonus_percentage, payment_type, payment_provider, status, seller_id, seller_withdrawal_details
      ) values (
        p_user_id, new_order_id, p_amount, p_base_amount, p_bonus_percentage, v_final_payment_type, p_payment_provider, 'pending_payment', seller_record.id, seller_record.withdrawal_method
      );

      -- Update the sell order
      update public.sell_orders
      set
        remaining_amount = remaining_amount - p_base_amount,
        status = case
          when (remaining_amount - p_base_amount) = 0 then 'processing' -- fully matched
          else 'partially_filled'
        end,
        matched_buy_orders = coalesce(matched_buy_orders, '[]'::jsonb) || jsonb_build_object(
          'buyOrderId', new_order_id,
          'buyerId', p_user_id,
          'amount', p_base_amount,
          'status', 'pending_payment',
          'createdAt', now()
        )
      where id = seller_record.id;

    else
      -- No suitable seller found, create a regular order
      insert into public.orders (
        user_id, order_id, amount, base_amount, bonus_percentage, payment_type, payment_provider, status
      ) values (
        p_user_id, new_order_id, p_amount, p_base_amount, p_bonus_percentage, p_payment_type, p_payment_provider, 'pending_payment'
      );
    end if;
  else
    -- Not eligible for P2P, create a regular order
    insert into public.orders (
      user_id, order_id, amount, base_amount, bonus_percentage, payment_type, payment_provider, status
    ) values (
      p_user_id, new_order_id, p_amount, p_base_amount, p_bonus_percentage, p_payment_type, p_payment_provider, 'pending_payment'
    );
  end if;

  return query select new_order_id, v_final_payment_type;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.cancel_buy_order(
    p_order_id bigint,
    p_cancellation_reason text,
    p_is_auto_cancel boolean
)
RETURNS void AS $$
declare
  target_order record;
  matched_seller_order record;
  buy_order_in_match jsonb;
  buy_order_index int;
begin
  -- Find the buy order
  select * into target_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Buy order not found.';
  end if;
  
  if target_order.status != 'pending_payment' then
      raise exception 'Order cannot be cancelled. Status is %', target_order.status;
  end if;

  -- If it's a P2P order, we need to revert changes on the sell order
  if target_order.payment_type = 'p2p_upi' or target_order.payment_type = 'p2p_bank' then
    if target_order.seller_id is null then
        raise exception 'P2P order is missing seller_id.';
    end if;

    -- Lock the sell order
    select * into matched_seller_order from public.sell_orders where id = target_order.seller_id for update;
    
    if found then
        -- Find the specific buy order match in the array
        select index - 1 into buy_order_index
        from public.sell_orders so, jsonb_array_elements(so.matched_buy_orders) with ordinality arr(item, index)
        where so.id = target_order.seller_id and arr.item->>'buyOrderId' = target_order.order_id;

        if buy_order_index is not null then
            -- Refund the amount to the seller's remaining_amount
            update public.sell_orders
            set
              remaining_amount = remaining_amount + target_order.base_amount,
              status = case
                when status = 'processing' then 'pending'
                else status
              end,
              -- Remove the buy order from the matched list
              matched_buy_orders = matched_buy_orders - buy_order_index
            where id = target_order.seller_id;
        end if;
    end if;
  end if;

  -- Finally, update the buy order's status
  update public.orders
  set
    status = case when p_is_auto_cancel then 'failed' else 'cancelled' end,
    cancellation_reason = p_cancellation_reason
  where id = target_order.id;

end;
$$ LANGUAGE plpgsql SECURITY DEFINER;
