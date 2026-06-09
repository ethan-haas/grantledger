-- SC6: Add CHECK constraint on expenses.amount (defense-in-depth alongside Zod validation)
ALTER TABLE expenses ADD CONSTRAINT expenses_amount_nonnegative CHECK (amount >= 0);

-- SC6: Add error_message column to accounting_connections
-- The connections API route, frontend interface, and UI all reference this column
-- but it was never added to the schema.
ALTER TABLE accounting_connections ADD COLUMN IF NOT EXISTS error_message TEXT;
