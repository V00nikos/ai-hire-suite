-- Add permissive SELECT policies for fully anonymous public access

-- Jobs: Anyone can view active jobs (permissive)
CREATE POLICY "Public can view active jobs" 
ON public.jobs 
FOR SELECT 
USING (status = 'active'::job_status);

-- Forms: Anyone can view forms for active jobs (permissive)
CREATE POLICY "Public can view forms for active jobs" 
ON public.forms 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = forms.job_id 
  AND jobs.status = 'active'::job_status
));

-- Form versions: Anyone can view published form versions for active jobs (permissive)
CREATE POLICY "Public can view published form versions" 
ON public.form_versions 
FOR SELECT 
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM forms 
    JOIN jobs ON jobs.id = forms.job_id 
    WHERE forms.id = form_versions.form_id 
    AND jobs.status = 'active'::job_status
  )
);

-- Create application-files storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-files', 'application-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: Anyone can upload to application-files bucket
CREATE POLICY "Anyone can upload application files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-files');

-- Storage: Anyone can view application files  
CREATE POLICY "Anyone can view application files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-files');