-- Tie reviews to a specific ask so users can review the same person across asks.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS ask_id uuid REFERENCES asks (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS reviews_ask_id_idx ON reviews (ask_id);

-- One review per reviewer per ask.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_ask_reviewer_unique
  ON reviews (ask_id, reviewer_id)
  WHERE ask_id IS NOT NULL;
