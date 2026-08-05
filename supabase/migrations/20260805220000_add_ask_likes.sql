-- Per-user likes on asks (one like per user per ask)
CREATE TABLE IF NOT EXISTS ask_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id uuid NOT NULL REFERENCES asks (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ask_likes_ask_user_unique UNIQUE (ask_id, user_id)
);

CREATE INDEX IF NOT EXISTS ask_likes_ask_id_idx ON ask_likes (ask_id);
CREATE INDEX IF NOT EXISTS ask_likes_user_id_idx ON ask_likes (user_id);

-- Denormalized count for feed / ask cards
ALTER TABLE asks
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- Backfill from existing likes (if any)
UPDATE asks a
SET like_count = sub.cnt
FROM (
  SELECT ask_id, COUNT(*)::integer AS cnt
  FROM ask_likes
  GROUP BY ask_id
) AS sub
WHERE a.id = sub.ask_id;
