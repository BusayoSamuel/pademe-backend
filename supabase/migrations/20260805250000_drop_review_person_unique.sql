-- Allow multiple reviews of the same person across different asks.
-- Uniqueness is now one review per (ask_id, reviewer_id).
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_ask_reviewer_unique
  ON reviews (ask_id, reviewer_id)
  WHERE ask_id IS NOT NULL;
