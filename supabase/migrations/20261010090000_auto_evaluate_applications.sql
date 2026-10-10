-- Score every new application automatically: an AFTER INSERT trigger calls the
-- evaluate-application edge function through pg_net. The function waits for the resume
-- upload (the public form inserts the application first, then the files), so the trigger
-- can fire immediately. verify_jwt is off for that function, so no key is embedded here.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.request_ai_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://gokdmkkvmbuklypdkrhm.supabase.co/functions/v1/evaluate-application',
    body := jsonb_build_object('application_id', NEW.id, 'wait_for_documents', true),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_application_created ON public.applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.request_ai_evaluation();
