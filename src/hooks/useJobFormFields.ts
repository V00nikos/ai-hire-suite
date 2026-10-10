import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationRubric, FormField } from '@/types/form';

interface JobFormFieldsData {
  formId: string;
  versionId: string;
  versionNumber: number;
  isPublished: boolean;
  fields: FormField[];
  rubric: EvaluationRubric | null;
}

export function useJobFormFields(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-form-fields', jobId],
    queryFn: async (): Promise<JobFormFieldsData | null> => {
      if (!jobId) return null;

      // Get form for job
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (formError || !form) {
        console.log('No form found for job:', jobId);
        return null;
      }

      // Get latest form version (regardless of publish status for editing)
      const { data: version, error: versionError } = await supabase
        .from('form_versions')
        .select('id, fields, is_published, version_number, evaluation_rubric')
        .eq('form_id', form.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError || !version) {
        console.log('No form version found for form:', form.id);
        return null;
      }

      return {
        formId: form.id,
        versionId: version.id,
        versionNumber: version.version_number,
        isPublished: version.is_published ?? false,
        fields: version.fields as unknown as FormField[],
        rubric: (version.evaluation_rubric as unknown as EvaluationRubric) ?? null,
      };
    },
    enabled: !!jobId,
    staleTime: 0, // Always fetch fresh data when refocused
  });
}
