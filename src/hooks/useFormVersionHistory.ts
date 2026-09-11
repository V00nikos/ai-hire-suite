import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormField } from '@/types/form';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface FormVersion {
  id: string;
  versionNumber: number;
  isPublished: boolean;
  createdAt: string;
  changeNotes: string | null;
  fields: FormField[];
}

export function useFormVersionHistory(jobId: string | undefined) {
  return useQuery({
    queryKey: ['form-version-history', jobId],
    queryFn: async (): Promise<FormVersion[]> => {
      if (!jobId) return [];

      // Get form for job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (formError || !form) return [];

      // Get all form versions
      const { data: versions, error: versionsError } = await supabase
        .from('form_versions')
        .select('id, version_number, is_published, created_at, change_notes, fields')
        .eq('form_id', form.id)
        .order('version_number', { ascending: false });

      if (versionsError || !versions) return [];

      return versions.map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        isPublished: v.is_published ?? false,
        createdAt: v.created_at ?? '',
        changeNotes: v.change_notes,
        fields: v.fields as unknown as FormField[],
      }));
    },
    enabled: !!jobId,
  });
}

export function useRestoreFormVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      jobId, 
      formId, 
      fields, 
      sourceVersionNumber 
    }: { 
      jobId: string;
      formId: string; 
      fields: FormField[]; 
      sourceVersionNumber: number;
    }) => {
      // Get the current max version number
      const { data: latestVersion, error: latestError } = await supabase
        .from('form_versions')
        .select('version_number')
        .eq('form_id', formId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (latestError) throw latestError;

      const newVersionNumber = (latestVersion?.version_number || 0) + 1;

      // Create new version with restored fields
      const { data: newVersion, error: insertError } = await supabase
        .from('form_versions')
        .insert([{
          form_id: formId,
          version_number: newVersionNumber,
          fields: fields as unknown as Json,
          is_published: true,
          change_notes: `Restored from version ${sourceVersionNumber}`,
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Update form's current_version
      const { error: updateError } = await supabase
        .from('forms')
        .update({ current_version: newVersionNumber })
        .eq('id', formId);

      if (updateError) throw updateError;

      return { newVersionId: newVersion.id, newVersionNumber };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-version-history'] });
      queryClient.invalidateQueries({ queryKey: ['job-form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['form-publish-status'] });
      queryClient.invalidateQueries({ queryKey: ['public-job'] });
      toast({
        title: 'Version Restored',
        description: `Form restored as version ${data.newVersionNumber} and published.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to restore form version',
        variant: 'destructive',
      });
    },
  });
}
