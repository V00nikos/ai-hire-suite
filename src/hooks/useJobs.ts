import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Job = Tables<'jobs'> & {
  candidateCount?: number;
};

export function useJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get candidate counts for each job
      const jobsWithCounts = await Promise.all(
        (jobs || []).map(async (job) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          return { ...job, candidateCount: count || 0 };
        })
      );

      return jobsWithCounts;
    },
    enabled: !!user,
  });
}

export function useJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobData: TablesInsert<'jobs'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...jobData, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Tables<'jobs'>>) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateJobWithForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      jobId,
      job,
      formFields,
      evaluationRubric,
    }: {
      jobId: string;
      job: Partial<Tables<'jobs'>>;
      formFields: unknown[];
      evaluationRubric?: unknown;
    }) => {
      // Update job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .update(job)
        .eq('id', jobId)
        .select()
        .single();

      if (jobError) throw jobError;

      // Get form for this job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('job_id', jobId)
        .single();

      if (formError) throw formError;

      // Get the latest form version
      const { data: version, error: versionFetchError } = await supabase
        .from('form_versions')
        .select('id')
        .eq('form_id', form.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (versionFetchError) throw versionFetchError;

      // Update form version with new fields
      const { error: versionError } = await supabase
        .from('form_versions')
        .update({
          fields: formFields as any,
          ...(evaluationRubric !== undefined && { evaluation_rubric: evaluationRubric as any }),
        })
        .eq('id', version.id);

      if (versionError) throw versionError;

      return jobData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
      queryClient.invalidateQueries({ queryKey: ['form-publish-status', data.id] });
      queryClient.invalidateQueries({ queryKey: ['public-job', data.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateJobWithForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      job,
      formFields,
      evaluationRubric,
    }: {
      job: TablesInsert<'jobs'>;
      formFields: unknown[];
      evaluationRubric?: unknown;
    }) => {
      // Create job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({ ...job, created_by: user?.id })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .insert({
          job_id: jobData.id,
          name: `${job.title} Application Form`,
          current_version: 1,
        })
        .select()
        .single();

      if (formError) throw formError;

      // Create form version
      const { error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: formData.id,
          version_number: 1,
          fields: formFields as any,
          evaluation_rubric: (evaluationRubric ?? null) as any,
          is_published: job.status === 'active',
          created_by: user?.id,
        });

      if (versionError) throw versionError;

      return jobData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
