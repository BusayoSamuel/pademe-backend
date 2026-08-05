ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS asker_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS doer_last_read_at timestamptz;
