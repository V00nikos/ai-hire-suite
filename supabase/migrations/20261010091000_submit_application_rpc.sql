-- Public application submission as one SECURITY DEFINER call. Anonymous applicants may INSERT
-- but not SELECT candidates/applications, so the old client-side insert(...).select('id') chain
-- failed under RLS for anyone not signed in. This function does the find-or-create candidate,
-- the application and the form responses in one transaction and returns only the new id.
CREATE OR REPLACE FUNCTION public.submit_application(
  p_job_id uuid,
  p_form_version_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_responses jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_candidate_id uuid;
  v_application_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email_required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jobs WHERE id = p_job_id AND status = 'active') THEN
    RAISE EXCEPTION 'job_not_accepting_applications';
  END IF;

  SELECT id INTO v_candidate_id FROM candidates WHERE lower(email) = v_email ORDER BY created_at LIMIT 1;
  IF v_candidate_id IS NULL THEN
    INSERT INTO candidates (email, name, phone, source)
    VALUES (v_email, COALESCE(NULLIF(trim(p_name), ''), 'Unknown'), NULLIF(trim(p_phone), ''), 'application')
    RETURNING id INTO v_candidate_id;
  END IF;

  IF EXISTS (SELECT 1 FROM applications WHERE job_id = p_job_id AND candidate_id = v_candidate_id) THEN
    RAISE EXCEPTION 'already_applied';
  END IF;

  INSERT INTO applications (candidate_id, job_id, form_version_id, status)
  VALUES (v_candidate_id, p_job_id, p_form_version_id, 'pending')
  RETURNING id INTO v_application_id;

  INSERT INTO form_responses (application_id, form_version_id, field_id, field_label, field_type, response_value)
  SELECT v_application_id, p_form_version_id, r->>'field_id', r->>'field_label', r->>'field_type', r->'response_value'
  FROM jsonb_array_elements(COALESCE(p_responses, '[]'::jsonb)) r
  WHERE p_form_version_id IS NOT NULL AND r->'response_value' IS NOT NULL;

  RETURN v_application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_application(uuid, uuid, text, text, text, jsonb) TO anon, authenticated;
