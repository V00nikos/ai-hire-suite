import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type Candidate = Tables<'candidates'>;
export type Application = Tables<'applications'>;
export type AIEvaluation = Tables<'ai_evaluations'>;

export interface CandidateWithApplication extends Candidate {
  application?: Application & {
    ai_evaluation?: AIEvaluation | null;
    job?: Tables<'jobs'> | null;
  };
}

export function useCandidates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          applications (
            *,
            ai_evaluations (*),
            jobs (id, title, department)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCandidatesForJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidates', 'job', jobId],
    queryFn: async () => {
      if (!jobId) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          candidates (*),
          ai_evaluations (*),
          application_documents (*),
          form_responses (*)
        `)
        .eq('job_id', jobId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((app) => {
        const aiEval = app.ai_evaluations;
        const formResponses = app.form_responses || [];
        
        // Extract specific fields from form responses
        const getFormValue = (fieldLabel: string): string | null => {
          const response = formResponses.find((r: any) => 
            r.field_label?.toLowerCase().includes(fieldLabel.toLowerCase())
          );
          if (!response) return null;
          const value = response.response_value;
          return typeof value === 'string' ? value : null;
        };
        
        const linkedinUrl = app.candidates?.linkedin_url || getFormValue('linkedin');
        const ctc = getFormValue('ctc');
        const noticePeriod = getFormValue('notice');
        const experience = getFormValue('experience') || getFormValue('years');
        
        return {
          id: app.candidates?.id || app.id,
          name: app.candidates?.name || 'Unknown',
          email: app.candidates?.email || '',
          phone: app.candidates?.phone,
          currentRole: '',
          experience: experience || '',
          // Use overall_score if available, fallback to legacy score
          score: aiEval?.overall_score ?? aiEval?.score ?? null,
          overallScore: aiEval?.overall_score ?? null,
          resumeScore: aiEval?.resume_score ?? null,
          videoScore: aiEval?.video_score ?? null,
          recommendation: aiEval?.recommendation ?? null,
          rank: aiEval?.ranking ?? null,
          status: app.status || 'pending',
          shortlisted: app.shortlisted || false,
          hasResume: app.application_documents?.some((d: any) => d.document_type === 'resume') || false,
          hasVideo: app.application_documents?.some((d: any) => d.document_type === 'video') || false,
          strengths: (aiEval?.strengths as string[]) || [],
          weaknesses: (aiEval?.weaknesses as string[]) || [],
          hasEvaluation: !!aiEval,
          applicationId: app.id,
          candidateId: app.candidates?.id,
          // New fields
          linkedinUrl,
          ctc,
          noticePeriod,
        };
      });
    },
    enabled: !!user && !!jobId,
  });
}

export function useShortlistedCandidates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidates', 'shortlisted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          candidates (*),
          ai_evaluations (*),
          jobs (id, title)
        `)
        .eq('shortlisted', true)
        .order('shortlisted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((app) => ({
        id: app.candidates?.id || app.id,
        name: app.candidates?.name || 'Unknown',
        email: app.candidates?.email || '',
        phone: app.candidates?.phone,
        currentRole: '',
        score: app.ai_evaluations?.score || null,
        hasResume: true,
        hasVideo: false,
        appliedTo: [app.job_id],
        jobTitle: app.jobs?.title,
        applicationId: app.id,
      }));
    },
    enabled: !!user,
  });
}

export function useCandidate(candidateId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return null;

      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          applications (
            *,
            ai_evaluations (*),
            jobs (id, title, department),
            application_documents (*),
            form_responses (*)
          )
        `)
        .eq('id', candidateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!candidateId,
  });
}
