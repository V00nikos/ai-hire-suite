import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFormPublishStatus(jobId: string | undefined) {
  return useQuery({
    queryKey: ['form-publish-status', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      // Get form for job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('job_id', jobId)
        .single();

      if (formError || !form) return null;

      // Get latest form version
      const { data: version, error: versionError } = await supabase
        .from('form_versions')
        .select('id, is_published, version_number')
        .eq('form_id', form.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (versionError || !version) return null;

      return {
        formId: form.id,
        versionId: version.id,
        isPublished: version.is_published,
        versionNumber: version.version_number,
      };
    },
    enabled: !!jobId,
  });
}

export function useToggleFormPublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ versionId, jobId, publish }: { versionId: string; jobId: string; publish: boolean }) => {
      // Update form version publish status
      const { error: versionError } = await supabase
        .from('form_versions')
        .update({ is_published: publish })
        .eq('id', versionId);

      if (versionError) throw versionError;

      // Also update job status - set to 'active' when publishing, keep as is when unpublishing
      if (publish) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: 'active' })
          .eq('id', jobId);

        if (jobError) throw jobError;
      }

      return { publish };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-publish-status'] });
      queryClient.invalidateQueries({ queryKey: ['public-job'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
      toast({
        title: data.publish ? "Form Published!" : "Form Unpublished",
        description: data.publish 
          ? "Candidates can now access the application form" 
          : "The application form is no longer publicly accessible",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update form publish status",
        variant: "destructive",
      });
    },
  });
}
