import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  shortlisted: number;
  pendingReview: number;
  hired: number;
}

export interface ApplicationsByRole {
  jobId: string;
  jobTitle: string;
  count: number;
  shortlisted: number;
  pending: number;
}

export interface TopCandidate {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  score: number;
  rank: number;
  shortlisted: boolean;
  applicationId: string;
}

export interface PipelineStats {
  applied: number;
  evaluated: number;
  shortlisted: number;
  hired: number;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get active jobs count
      const { count: activeJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total candidates count
      const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      // Get shortlisted count
      const { count: shortlisted } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('shortlisted', true);

      // Get pending review count
      const { count: pendingReview } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get hired count
      const { count: hired } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hired');

      return {
        activeJobs: activeJobs || 0,
        totalCandidates: totalCandidates || 0,
        shortlisted: shortlisted || 0,
        pendingReview: pendingReview || 0,
        hired: hired || 0
      } as DashboardStats;
    },
    enabled: !!user
  });
}

export function useApplicationsByRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['applications-by-role'],
    queryFn: async () => {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('status', 'active');

      if (jobsError) throw jobsError;

      const results: ApplicationsByRole[] = [];

      for (const job of jobs || []) {
        const { count: total } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        const { count: shortlisted } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)
          .eq('shortlisted', true);

        const { count: pending } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)
          .eq('status', 'pending');

        results.push({
          jobId: job.id,
          jobTitle: job.title,
          count: total || 0,
          shortlisted: shortlisted || 0,
          pending: pending || 0
        });
      }

      return results.sort((a, b) => b.count - a.count);
    },
    enabled: !!user
  });
}

export function useTopCandidates(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-candidates', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_evaluations')
        .select(`
          id,
          score,
          ranking,
          application:applications(
            id,
            shortlisted,
            candidate:candidates(id, name, email),
            job:jobs(id, title)
          )
        `)
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((eval_data, index) => {
        const app = eval_data.application as any;
        return {
          id: eval_data.id,
          candidateId: app?.candidate?.id || '',
          candidateName: app?.candidate?.name || 'Unknown',
          candidateEmail: app?.candidate?.email || '',
          jobTitle: app?.job?.title || 'Unknown',
          jobId: app?.job?.id || '',
          score: eval_data.score || 0,
          rank: index + 1,
          shortlisted: app?.shortlisted || false,
          applicationId: app?.id || ''
        };
      }) as TopCandidate[];
    },
    enabled: !!user
  });
}

export function usePipelineStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      // Total applications
      const { count: applied } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      // Evaluated (has AI evaluation)
      const { count: evaluated } = await supabase
        .from('ai_evaluations')
        .select('*', { count: 'exact', head: true });

      // Shortlisted
      const { count: shortlisted } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('shortlisted', true);

      // Hired
      const { count: hired } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hired');

      return {
        applied: applied || 0,
        evaluated: evaluated || 0,
        shortlisted: shortlisted || 0,
        hired: hired || 0
      } as PipelineStats;
    },
    enabled: !!user
  });
}
