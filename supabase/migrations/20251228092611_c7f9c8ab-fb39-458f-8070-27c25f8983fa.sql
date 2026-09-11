-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS rubric_generation_history CASCADE;
DROP TABLE IF EXISTS evaluation_rubrics CASCADE;
DROP TABLE IF EXISTS ai_evaluation_queue CASCADE;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS get_job_rubrics(UUID);