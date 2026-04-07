# Complete SQL Migration Commands for Render PostgreSQL

## Database Connection Details
- Host: `dpg-d6ql2e7kijhs73b7rfag-a.oregon-postgres.render.com`
- Port: `5432`
- Database: `oride_db`
- User: `oride_db_user`

## Step 1: Connect to Database

### Via Render Dashboard (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your PostgreSQL database
3. Click "Access your psql database"
4. Paste the commands below in the query editor

### Via CLI (Alternative)
```bash
psql "postgresql://oride_db_user:3tlzVbNAG6NvMeE9u6MA9oNf7C5VB3X6@dpg-d6ql2e7kijhs73b7rfag-a.oregon-postgres.render.com:5432/oride_db"
```

## Step 2: Run These Exact SQL Commands (Copy & Paste All at Once)

```sql
-- ========================================
-- MIGRATION: April 7, 2026
-- ========================================

-- 1. Add ride_type column to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS ride_type VARCHAR(50) DEFAULT 'standard';

-- 2. Create paystack_customers table
CREATE TABLE IF NOT EXISTS paystack_customers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_code VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create virtual_accounts table
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

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ride_type ON rides(ride_type);
CREATE INDEX IF NOT EXISTS idx_paystack_customers_user_id ON paystack_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_paystack_customers_customer_code ON paystack_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON virtual_accounts(account_number);

-- 5. Verify the migration (run these to check)
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'rides' AND column_name = 'ride_type';

SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('paystack_customers', 'virtual_accounts');
```

## Step 3: Verify Schema is Correct

After running the migration, execute these commands to verify all tables and columns exist:

```sql
-- Check rides table columns
\d rides

-- Check driver_profiles table
\d driver_profiles

-- Check all created tables
\dt

-- Check that all required columns exist in driver_profiles
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'driver_profiles'
ORDER BY ordinal_position;
```

## Step 4: Expected Output After Migration

All of these should return `1` or show the table exists:

```sql
-- Verify ride_type column exists
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'rides' AND column_name = 'ride_type';
-- Expected: 1

-- Verify paystack_customers table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'paystack_customers';
-- Expected: 1

-- Verify virtual_accounts table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'virtual_accounts';
-- Expected: 1
```

## Required Schema Structure Reference

### rides table (required columns)
- `id` (SERIAL PRIMARY KEY) ✓
- `passenger_id` (INT) ✓
- `driver_id` (INT) ✓
- `pickup` (TEXT) ✓
- `dropoff` (TEXT) ✓
- `fare` (NUMERIC) ✓
- `distance_km` (NUMERIC) ✓
- `status` (VARCHAR) ✓
- `payment_method` (VARCHAR) ✓
- `ride_type` (VARCHAR) **← MUST EXIST AFTER MIGRATION**
- `created_at` (TIMESTAMP) ✓
- `updated_at` (TIMESTAMP) ✓

### driver_profiles table (required columns)
- `id` (SERIAL PRIMARY KEY) ✓
- `user_id` (INT UNIQUE) ✓
- `vehicle_type` (VARCHAR) ✓
- `vehicle_brand` (VARCHAR) ✓
- `vehicle_model` (VARCHAR) ✓
- `plate_number` (VARCHAR) ✓
- `vehicle_image` (TEXT) ✓
- `is_online` (BOOLEAN) ✓
- `created_at` (TIMESTAMP) ✓
- `updated_at` (TIMESTAMP) ✓

### paystack_customers table (NEW - MUST BE CREATED)
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INT UNIQUE)
- `customer_code` (VARCHAR(100))
- `email` (VARCHAR(120))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### virtual_accounts table (NEW - MUST BE CREATED)
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INT UNIQUE)
- `customer_code` (VARCHAR(100))
- `account_name` (VARCHAR(200))
- `account_number` (VARCHAR(20))
- `bank_name` (VARCHAR(100))
- `provider_slug` (VARCHAR(50))
- `paystack_dva_id` (VARCHAR(100))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## About Passenger Dashboard

✅ **The passenger dashboard is already working correctly!** 

The passenger controller queries only standard existing columns:
- `wallets.balance` ✓
- `rides.*` ✓
- `notifications.*` ✓
- `support_tickets.*` ✓

No changes needed for passenger dashboard - it will work once the main migrations are applied.

## Troubleshooting

If you get an error like:
- `column "ride_type" does not exist` → Run the migration
- `relation "paystack_customers" does not exist` → Run the migration
- `relation "virtual_accounts" does not exist` → Run the migration

## Files to Reference

- Migration script: `server/sql/migration_20260406.sql`
- Complete schema: `server/sql/schema.sql`
- Updated controllers: 
  - `server/src/controllers/driver.controller.js`
  - `server/src/controllers/admin.controller.js`
  - `server/src/controllers/ride.controller.js`
  - `server/src/controllers/payment.controller.js`

## Timeline

After migration is applied to Render database:
1. All 500 errors should be resolved
2. Admin dashboard will work
3. Driver dashboard will work
4. Passenger dashboard will work
5. Payment virtual account creation will work
