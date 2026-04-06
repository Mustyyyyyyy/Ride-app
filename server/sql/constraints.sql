-- Additional constraints for data integrity
-- Run these after the main schema if needed

-- Ensure wallet balances are never negative (can be enforced in application logic)
-- ALTER TABLE wallets ADD CONSTRAINT chk_wallet_balance CHECK (balance >= 0);

-- Valid ride statuses
-- ALTER TABLE rides ADD CONSTRAINT chk_ride_status
--   CHECK (status IN ('pending', 'accepted', 'ongoing', 'completed', 'cancelled'));

-- Valid user roles
-- ALTER TABLE users ADD CONSTRAINT chk_user_role
--   CHECK (role IN ('passenger', 'driver', 'admin'));

-- Valid payment methods
-- ALTER TABLE rides ADD CONSTRAINT chk_payment_method
--   CHECK (payment_method IN ('cash', 'wallet'));

-- Valid transaction types
-- ALTER TABLE transactions ADD CONSTRAINT chk_transaction_type
--   CHECK (type IN ('credit', 'debit'));

-- Note: These constraints are commented out because they might conflict with existing data
-- Test them first before applying in production