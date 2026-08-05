-- Add amount to offers (doer bid; must be > 0)
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS amount numeric(12, 2);

-- Backfill existing rows from the related ask budget
UPDATE offers o
SET amount = a.amount
FROM asks a
WHERE o.ask_id = a.id
  AND o.amount IS NULL;

-- Require amount going forward
ALTER TABLE offers
  ALTER COLUMN amount SET NOT NULL;
