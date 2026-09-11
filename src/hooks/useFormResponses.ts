import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type FormResponse = Tables<'form_responses'>;

/**
 * Fetch form responses for a specific application
 */
export function useFormResponsesForApplication(applicationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['form-responses', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!applicationId,
  });
}

/**
 * Fetch form responses grouped by application for a job
 */
export function useFormResponsesForJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['form-responses', 'job', jobId],
    queryFn: async () => {
      if (!jobId) return {};

      // First get all applications for this job
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId);

      if (appError) throw appError;
      if (!applications || applications.length === 0) return {};

      const applicationIds = applications.map(a => a.id);

      // Get all form responses for these applications
      const { data: responses, error: respError } = await supabase
        .from('form_responses')
        .select('*')
        .in('application_id', applicationIds);

      if (respError) throw respError;

      // Group by application_id
      const grouped: Record<string, FormResponse[]> = {};
      for (const response of responses || []) {
        if (!grouped[response.application_id]) {
          grouped[response.application_id] = [];
        }
        grouped[response.application_id].push(response);
      }

      return grouped;
    },
    enabled: !!user && !!jobId,
  });
}
