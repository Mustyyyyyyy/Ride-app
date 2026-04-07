-- COPY AND PASTE ALL COMMANDS AT ONCE INTO RENDER DASHBOARD QUERY EDITOR

ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(50) DEFAULT 'standard';

CREATE TABLE IF NOT EXISTS paystack_customers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_code VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS virtual_accounts (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_code VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  provider_slug VARCHAR(50),
  paystack_dva_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_type ON rides(ride_type);
CREATE INDEX IF NOT EXISTS idx_paystack_customers_user_id ON paystack_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_paystack_customers_customer_code ON paystack_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON virtual_accounts(account_number);

-- VERIFY MIGRATION WORKED (these should all return 1)
SELECT COUNT(*) as ride_type_exists FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'ride_type';
SELECT COUNT(*) as paystack_customers_exists FROM information_schema.tables WHERE table_name = 'paystack_customers';
SELECT COUNT(*) as virtual_accounts_exists FROM information_schema.tables WHERE table_name = 'virtual_accounts';
