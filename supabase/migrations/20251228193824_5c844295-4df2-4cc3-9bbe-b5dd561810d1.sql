-- Add missing columns to ai_evaluations table for full AI evaluation data
ALTER TABLE ai_evaluations
ADD COLUMN IF NOT EXISTS resume_score INTEGER CHECK (resume_score >= 0 AND resume_score <= 100),
ADD COLUMN IF NOT EXISTS video_score INTEGER CHECK (video_score >= 0 AND video_score <= 100),
ADD COLUMN IF NOT EXISTS overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
ADD COLUMN IF NOT EXISTS recommendation TEXT CHECK (recommendation IN ('STRONG YES', 'YES', 'MAYBE', 'NO', 'STRONG NO')),
ADD COLUMN IF NOT EXISTS hiring_manager_notes TEXT;

-- Create indexes for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_recommendation ON ai_evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_overall_score ON ai_evaluations(overall_score DESC);