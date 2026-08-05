-- Escrow: charge asker on choose/confirm, transfer askie fee after complete
ALTER TABLE asks
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_held boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS askie_fee_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text;
