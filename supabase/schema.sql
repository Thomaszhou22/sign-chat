-- Supabase schema for shared ASL training data
-- Run this in Supabase SQL Editor

-- Training samples table
CREATE TABLE IF NOT EXISTS asl_training_samples (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  landmarks JSONB NOT NULL, -- 63 normalized values
  user_hash TEXT, -- anonymous hash to identify contributor (no PII)
  is_flagged BOOLEAN DEFAULT FALSE, -- flagged as potential outlier
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast label-based queries
CREATE INDEX IF NOT EXISTS idx_training_label ON asl_training_samples(label);
CREATE INDEX IF NOT EXISTS idx_training_flagged ON asl_training_samples(is_flagged);
CREATE INDEX IF NOT EXISTS idx_training_created ON asl_training_samples(created_at DESC);

-- Enable RLS
ALTER TABLE asl_training_samples ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-flagged samples
CREATE POLICY "Public read non-flagged" ON asl_training_samples
  FOR SELECT USING (is_flagged = FALSE);

-- Anyone can insert
CREATE POLICY "Public insert" ON asl_training_samples
  FOR INSERT WITH CHECK (true);

-- Users can flag samples (for community moderation later)
CREATE POLICY "Public update flag" ON asl_training_samples
  FOR UPDATE USING (true);

-- Stats view: per-label statistics
CREATE OR REPLACE VIEW asl_training_stats AS
SELECT 
  label,
  COUNT(*) as sample_count,
  AVG(created_at) as avg_created
FROM asl_training_samples
WHERE is_flagged = FALSE
GROUP BY label
ORDER BY sample_count DESC;

-- Function: get samples for a label (limited)
CREATE OR REPLACE FUNCTION get_training_samples(target_label TEXT, lim INT DEFAULT 50)
RETURNS SETOF asl_training_samples AS $$
  SELECT * FROM asl_training_samples
  WHERE label = target_label AND is_flagged = FALSE
  ORDER BY created_at DESC
  LIMIT lim;
$$ LANGUAGE sql STABLE;
