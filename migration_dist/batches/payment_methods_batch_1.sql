INSERT INTO public.payment_methods (type, bank_name, account_holder_name, account_number, ifsc_code, upi_holder_name, upi_id, usdt_wallet_address)
VALUES
(NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('upi', NULL, NULL, NULL, NULL, 'RITIK', 'ritikraushankum788585.rzp@rxaxis', NULL),
('usdt', NULL, NULL, NULL, NULL, NULL, NULL, 'TFepVWa4ywRN42sceQy916NsqKmLUKAKM2'),
('bank', 'Indian Bank ', 'Vici', '22084707892', 'IDIB000M520', NULL, NULL, NULL),
(NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('upi', NULL, NULL, NULL, NULL, 'Boss', 'gt650.9@ibl', NULL)
ON CONFLICT  DO NOTHING;