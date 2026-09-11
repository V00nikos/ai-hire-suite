import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormField } from '@/types/form';
import { useToast } from '@/hooks/use-toast';

export interface PublicJobData {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  location: string | null;
  employment_type: string | null;
  form_config: FormField[];
  form_version_id: string | null;
}

export function usePublicJob(jobId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastVersionIdRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ['public-job', jobId],
    queryFn: async (): Promise<PublicJobData | null> => {
      if (!jobId) return null;

      // Fetch the job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, department, description, requirements, location, employment_type')
        .eq('id', jobId)
        .eq('status', 'active')
        .single();

      if (jobError || !job) {
        console.error('Error fetching job:', jobError);
        return null;
      }

      // Fetch the form for this job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('job_id', jobId)
        .single();

      if (formError || !form) {
        console.error('Error fetching form:', formError);
        return null;
      }

      // Fetch the published form version
      const { data: formVersion, error: versionError } = await supabase
        .from('form_versions')
        .select('id, fields')
        .eq('form_id', form.id)
        .eq('is_published', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (versionError || !formVersion) {
        console.error('Error fetching form version:', versionError);
        return null;
      }

      return {
        id: job.id,
        title: job.title,
        department: job.department,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        employment_type: job.employment_type,
        form_config: formVersion.fields as unknown as FormField[],
        form_version_id: formVersion.id,
      };
    },
    enabled: !!jobId,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds while tab is active
  });

  // Detect version changes and show toast
  useEffect(() => {
    if (query.data?.form_version_id) {
      const newVersionId = query.data.form_version_id;
      const previousVersionId = lastVersionIdRef.current;
      
      // Only show toast if we had a previous version and it changed
      if (previousVersionId && previousVersionId !== newVersionId) {
        toast({
          title: 'Form Updated',
          description: 'The application form has been updated with the latest fields.',
        });
      }
      
      lastVersionIdRef.current = newVersionId;
    }
  }, [query.data?.form_version_id, toast]);

  return query;
}
