-- Allow anyone to view active jobs (for application form)
CREATE POLICY "Anyone can view active jobs"
ON public.jobs
FOR SELECT
USING (status = 'active');

-- Allow anyone to view forms for active jobs
CREATE POLICY "Anyone can view forms for active jobs"
ON public.forms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = forms.job_id 
    AND jobs.status = 'active'
  )
);

-- Allow anyone to view published form versions for active jobs
CREATE POLICY "Anyone can view published form versions"
ON public.form_versions
FOR SELECT
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM public.forms
    JOIN public.jobs ON jobs.id = forms.job_id
    WHERE forms.id = form_versions.form_id
    AND jobs.status = 'active'
  )
);

-- Allow anyone to insert candidates (for public applications)
CREATE POLICY "Anyone can insert candidates for applications"
ON public.candidates
FOR INSERT
WITH CHECK (true);