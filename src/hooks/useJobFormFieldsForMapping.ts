import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FormField } from '@/types/form';

interface FormFieldsForMapping {
  formVersionId: string;
  fields: FormField[];
  isPublished: boolean;
  versionNumber: number;
}

/**
 * Fetches the published form version fields for a job
 * Used for bulk upload field mapping
 */
export function useJobFormFieldsForMapping(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-form-fields-mapping', jobId],
    queryFn: async (): Promise<FormFieldsForMapping | null> => {
      if (!jobId) return null;

      // First get the form for this job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id, current_version')
        .eq('job_id', jobId)
        .maybeSingle();

      if (formError) throw formError;
      if (!form) return null;

      // Get the published form version (or latest if none published)
      const { data: formVersion, error: versionError } = await supabase
        .from('form_versions')
        .select('id, fields, is_published, version_number')
        .eq('form_id', form.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError) throw versionError;
      if (!formVersion) return null;

      // Parse fields from JSONB
      const fields = (formVersion.fields as unknown as FormField[]) || [];

      // Filter out description_block fields (display-only, not for data)
      const mappableFields = fields.filter(f => f.type !== 'description_block');

      return {
        formVersionId: formVersion.id,
        fields: mappableFields,
        isPublished: formVersion.is_published || false,
        versionNumber: formVersion.version_number,
      };
    },
    enabled: !!user && !!jobId,
  });
}
