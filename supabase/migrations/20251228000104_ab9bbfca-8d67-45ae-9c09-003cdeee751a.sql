-- Create candidate_notes table for storing recruiter notes
CREATE TABLE public.candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Recruiters can manage notes
CREATE POLICY "Recruiters can view notes" 
ON public.candidate_notes 
FOR SELECT 
USING (is_recruiter());

CREATE POLICY "Recruiters can insert notes" 
ON public.candidate_notes 
FOR INSERT 
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own notes" 
ON public.candidate_notes 
FOR UPDATE 
USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own notes" 
ON public.candidate_notes 
FOR DELETE 
USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at
CREATE TRIGGER update_candidate_notes_updated_at
BEFORE UPDATE ON public.candidate_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();