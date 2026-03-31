
-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    numeric_id TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT,
    display_name TEXT,
    photo_url TEXT,
    balance NUMERIC(10, 2) DEFAULT 0.00,
    hold_balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    inviter_uid UUID REFERENCES users(id),
    claimed_user_rewards TEXT[],
    payment_methods JSONB,
    session_id TEXT
);

-- Create the orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
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
    admin_payment_method_id INTEGER,
    seller_id UUID,
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
CREATE TABLE sell_orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
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
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    order_id TEXT,
    amount NUMERIC(10, 2),
    description TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the payment_methods table (for admin)
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
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
CREATE TABLE chat_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    user_numeric_id TEXT,
    entered_identifier TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    chat_history JSONB,
    agent_id TEXT,
    agent_joined_at TIMESTAMPTZ
);

-- Create reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    case_id TEXT UNIQUE,
    user_id UUID REFERENCES users(id),
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
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    user_numeric_id TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create qr_payments table for Razorpay
CREATE TABLE qr_payments (
    id TEXT PRIMARY KEY,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid BOOLEAN DEFAULT false,
    user_id UUID,
    method_name TEXT,
    payer_vpa TEXT,
    razorpay_payment_id TEXT,
    paid_at TIMESTAMPTZ,
    amount NUMERIC(10, 2)
);


-- Row Level Security (RLS) Policies

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_payments ENABLE ROW LEVEL SECURITY;

-- Policies for 'users' table
CREATE POLICY "Users can view their own profile." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Allow service_role to bypass RLS for admin operations. Public users can be read by anyone for invite lookups.
CREATE POLICY "Public user data is viewable by everyone." ON users FOR SELECT USING (true);


-- Policies for 'orders' table
CREATE POLICY "Users can view their own orders." ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders." ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending orders." ON orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_payment') WITH CHECK (auth.uid() = user_id);

-- Policies for 'sell_orders' table
CREATE POLICY "Users can view their own sell orders." ON sell_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sell orders." ON sell_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel their own pending sell orders." ON sell_orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);


-- Policies for 'transactions' table
CREATE POLICY "Users can view their own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'payment_methods' (Admin methods)
-- Admin methods should be readable by authenticated users so they know where to pay.
CREATE POLICY "Authenticated users can view payment methods." ON payment_methods FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'chat_requests'
-- Allow anyone to create a chat request (for guest support)
CREATE POLICY "Anyone can create a chat request." ON chat_requests FOR INSERT WITH CHECK (true);
-- Users can see their own chat requests
CREATE POLICY "Users can view their own chat requests." ON chat_requests FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'reports'
CREATE POLICY "Users can create their own reports." ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reports." ON reports FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'feedback'
CREATE POLICY "Authenticated users can submit feedback." ON feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for 'qr_payments'
CREATE POLICY "Users can view their own QR payments" ON qr_payments FOR SELECT USING (auth.uid() = user_id);

-- Allow admin (service_role) to access all tables
-- This is implicit as service_role bypasses RLS, but let's be explicit for clarity.
CREATE POLICY "Enable all access for service_role on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on sell_orders" ON sell_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on chat_requests" ON chat_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for service_role on qr_payments" ON qr_payments FOR ALL USING (true) WITH CHECK (true);
