-- Enable required extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call realtime-sync edge function
CREATE OR REPLACE FUNCTION public.sync_record_to_personal_db()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
BEGIN
  -- Build the payload based on operation type
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'old_record', row_to_json(OLD)::jsonb,
      'record', null
    );
  ELSE
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'record', row_to_json(NEW)::jsonb,
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE null END
    );
  END IF;

  -- Call the edge function asynchronously using pg_net
  -- The URL will be constructed using the project reference
  edge_function_url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/realtime-sync';
  
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <YOUR-ANON-KEY>'
    )::jsonb,
    body := payload
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create real-time sync triggers for key tables

-- Candidates table
DROP TRIGGER IF EXISTS sync_candidates_to_personal ON public.candidates;
CREATE TRIGGER sync_candidates_to_personal
AFTER INSERT OR UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.sync_record_to_personal_db();

-- Applications table
DROP TRIGGER IF EXISTS sync_applications_to_personal ON public.applications;
CREATE TRIGGER sync_applications_to_personal
AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_record_to_personal_db();

-- Form responses table
DROP TRIGGER IF EXISTS sync_form_responses_to_personal ON public.form_responses;
CREATE TRIGGER sync_form_responses_to_personal
AFTER INSERT ON public.form_responses
FOR EACH ROW
EXECUTE FUNCTION public.sync_record_to_personal_db();

-- AI evaluations table
DROP TRIGGER IF EXISTS sync_ai_evaluations_to_personal ON public.ai_evaluations;
CREATE TRIGGER sync_ai_evaluations_to_personal
AFTER INSERT OR UPDATE ON public.ai_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.sync_record_to_personal_db();

-- Application documents table
DROP TRIGGER IF EXISTS sync_app_documents_to_personal ON public.application_documents;
CREATE TRIGGER sync_app_documents_to_personal
AFTER INSERT ON public.application_documents
FOR EACH ROW
EXECUTE FUNCTION public.sync_record_to_personal_db();