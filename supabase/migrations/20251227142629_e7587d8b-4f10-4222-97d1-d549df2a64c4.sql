-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('pending', 'evaluated', 'shortlisted', 'rejected', 'on_hold', 'hired', 'withdrawn');

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('draft', 'active', 'paused', 'closed');

-- Create enum for employment type
CREATE TYPE public.employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');

-- Create enum for document type
CREATE TYPE public.document_type AS ENUM ('resume', 'video', 'cover_letter', 'portfolio', 'linkedin', 'assignment', 'other');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter', 'viewer');

-- 1. PROFILES (Recruiters)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. USER_ROLES (Separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 3. CANDIDATES (Unique applicants)
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  source TEXT DEFAULT 'application',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CANDIDATE_DOCUMENTS
CREATE TABLE public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements TEXT,
  status job_status DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  location TEXT,
  employment_type employment_type DEFAULT 'full-time',
  salary_min INTEGER,
  salary_max INTEGER,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FORMS (One per job)
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  current_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FORM_VERSIONS
CREATE TABLE public.form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_rubric JSONB,
  change_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false,
  UNIQUE(form_id, version_number)
);

-- 8. APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id),
  form_version_id UUID REFERENCES public.form_versions(id),
  status application_status DEFAULT 'pending',
  shortlisted BOOLEAN DEFAULT false,
  bulk_uploaded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  shortlisted_at TIMESTAMPTZ,
  external_id TEXT,
  synced_to_external BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  UNIQUE(job_id, candidate_id)
);

-- 9. FORM_RESPONSES
CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  form_version_id UUID NOT NULL REFERENCES public.form_versions(id),
  field_id TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  response_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. APPLICATION_DOCUMENTS
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AI_EVALUATIONS
CREATE TABLE public.ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  form_version_id UUID REFERENCES public.form_versions(id),
  score INTEGER,
  ranking INTEGER,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  interview_questions JSONB DEFAULT '[]'::jsonb,
  rubric_scores JSONB,
  model_used TEXT,
  raw_response JSONB,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTES
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACTIVITY_LOG
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  job_id UUID REFERENCES public.jobs(id),
  application_id UUID REFERENCES public.applications(id),
  candidate_id UUID REFERENCES public.candidates(id),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_name ON public.candidates(name);
CREATE INDEX idx_candidate_docs ON public.candidate_documents(candidate_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX idx_forms_job ON public.forms(job_id);
CREATE INDEX idx_form_versions ON public.form_versions(form_id, version_number);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_form_responses_app ON public.form_responses(application_id);
CREATE INDEX idx_app_docs ON public.application_documents(application_id);
CREATE INDEX idx_ai_eval_app ON public.ai_evaluations(application_id);
CREATE INDEX idx_notes_app ON public.notes(application_id);
CREATE INDEX idx_activity_job ON public.activity_log(job_id);
CREATE INDEX idx_activity_app ON public.activity_log(application_id);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is authenticated recruiter
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
  )
$$;

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Assign default recruiter role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'recruiter');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create update triggers
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Roles: Only admins can manage, users can read own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Candidates: All authenticated recruiters can CRUD
CREATE POLICY "Recruiters can view all candidates" ON public.candidates
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert candidates" ON public.candidates
  FOR INSERT TO authenticated WITH CHECK (public.is_recruiter());

CREATE POLICY "Recruiters can update candidates" ON public.candidates
  FOR UPDATE TO authenticated USING (public.is_recruiter());

-- Candidate Documents
CREATE POLICY "Recruiters can view candidate documents" ON public.candidate_documents
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert candidate documents" ON public.candidate_documents
  FOR INSERT TO authenticated WITH CHECK (public.is_recruiter());

-- Jobs: Recruiters can CRUD
CREATE POLICY "Recruiters can view all jobs" ON public.jobs
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (public.is_recruiter());

CREATE POLICY "Recruiters can update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can delete own jobs" ON public.jobs
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Forms
CREATE POLICY "Recruiters can view forms" ON public.forms
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert forms" ON public.forms
  FOR INSERT TO authenticated WITH CHECK (public.is_recruiter());

CREATE POLICY "Recruiters can update forms" ON public.forms
  FOR UPDATE TO authenticated USING (public.is_recruiter());

-- Form Versions
CREATE POLICY "Recruiters can view form versions" ON public.form_versions
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert form versions" ON public.form_versions
  FOR INSERT TO authenticated WITH CHECK (public.is_recruiter());

CREATE POLICY "Recruiters can update form versions" ON public.form_versions
  FOR UPDATE TO authenticated USING (public.is_recruiter());

-- Applications: Recruiters can CRUD, public can insert (for candidate submissions)
CREATE POLICY "Recruiters can view all applications" ON public.applications
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Anyone can submit applications" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Recruiters can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (public.is_recruiter());

-- Form Responses
CREATE POLICY "Recruiters can view form responses" ON public.form_responses
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Anyone can insert form responses" ON public.form_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Application Documents
CREATE POLICY "Recruiters can view application documents" ON public.application_documents
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Anyone can insert application documents" ON public.application_documents
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- AI Evaluations
CREATE POLICY "Recruiters can view AI evaluations" ON public.ai_evaluations
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "System can insert AI evaluations" ON public.ai_evaluations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "System can update AI evaluations" ON public.ai_evaluations
  FOR UPDATE TO authenticated USING (public.is_recruiter());

-- Notes
CREATE POLICY "Recruiters can view notes" ON public.notes
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "Recruiters can insert notes" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own notes" ON public.notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own notes" ON public.notes
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Activity Log
CREATE POLICY "Recruiters can view activity log" ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_recruiter());

CREATE POLICY "System can insert activity log" ON public.activity_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Create storage bucket for candidate files
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-files', 'candidate-files', true);

-- Storage policies
CREATE POLICY "Anyone can upload candidate files" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'candidate-files');

CREATE POLICY "Anyone can view candidate files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'candidate-files');

CREATE POLICY "Recruiters can delete candidate files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-files');

-- Enable realtime for applications and ai_evaluations
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_evaluations;