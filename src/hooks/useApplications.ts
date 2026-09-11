import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BulkUploadPayload, FieldMapping, BulkCandidate } from '@/types/bulkUpload';

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      shortlisted,
    }: {
      applicationId: string;
      status?: string;
      shortlisted?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (shortlisted !== undefined) {
        updates.shortlisted = shortlisted;
        updates.shortlisted_at = shortlisted ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBulkUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      jobId,
      formVersionId,
      candidates,
      fieldMappings,
    }: BulkUploadPayload) => {
      const results = [];

      for (const candidate of candidates) {
        // Check if candidate exists by email
        let candidateId: string;
        const { data: existingCandidate } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', candidate.email)
          .maybeSingle();

        if (existingCandidate) {
          candidateId = existingCandidate.id;
        } else {
          // Create new candidate
          const { data: newCandidate, error: candidateError } = await supabase
            .from('candidates')
            .insert({
              name: candidate.name,
              email: candidate.email,
              phone: candidate.phone,
              source: 'bulk_upload',
            })
            .select()
            .single();

          if (candidateError) throw candidateError;
          candidateId = newCandidate.id;
        }

        // Check if application already exists for this candidate + job
        let applicationId: string;
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('candidate_id', candidateId)
          .eq('job_id', jobId)
          .maybeSingle();

        if (existingApp) {
          applicationId = existingApp.id;
          await supabase
            .from('applications')
            .update({ bulk_uploaded: true, form_version_id: formVersionId })
            .eq('id', applicationId);
          
          // Delete existing form responses for this application to replace with new ones
          await supabase
            .from('form_responses')
            .delete()
            .eq('application_id', applicationId);
        } else {
          const { data: application, error: appError } = await supabase
            .from('applications')
            .insert({
              candidate_id: candidateId,
              job_id: jobId,
              status: 'pending',
              bulk_uploaded: true,
              form_version_id: formVersionId,
            })
            .select()
            .single();

          if (appError) throw appError;
          applicationId = application.id;
        }

        // Create form_responses for each mapped field
        const formResponses = fieldMappings
          .filter(m => m.csvColumn && candidate.rawData[m.csvColumn])
          .map(mapping => ({
            application_id: applicationId,
            form_version_id: formVersionId,
            field_id: mapping.formFieldId,
            field_label: mapping.formFieldLabel,
            field_type: mapping.formFieldType,
            response_value: candidate.rawData[mapping.csvColumn!],
          }));

        if (formResponses.length > 0) {
          const { error: responseError } = await supabase
            .from('form_responses')
            .insert(formResponses);
          
          if (responseError) {
            console.error('Error inserting form responses:', responseError);
          }
        }

        // Upload resume file
        if (candidate.resumeFile) {
          const resumePath = `applications/${applicationId}/resume-${candidate.resumeFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('application-files')
            .upload(resumePath, candidate.resumeFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('application-files')
              .getPublicUrl(resumePath);

            await supabase.from('application_documents').insert({
              application_id: applicationId,
              document_type: 'resume',
              filename: candidate.resumeFile.name,
              file_url: urlData.publicUrl,
              file_size: candidate.resumeFile.size,
            });

            await supabase.from('candidate_documents').insert({
              candidate_id: candidateId,
              document_type: 'resume',
              filename: candidate.resumeFile.name,
              file_url: urlData.publicUrl,
              file_size: candidate.resumeFile.size,
            });
          }
        }

        // Upload video file
        if (candidate.videoFile) {
          const videoPath = `applications/${applicationId}/video-${candidate.videoFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('application-files')
            .upload(videoPath, candidate.videoFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('application-files')
              .getPublicUrl(videoPath);

            await supabase.from('application_documents').insert({
              application_id: applicationId,
              document_type: 'video',
              filename: candidate.videoFile.name,
              file_url: urlData.publicUrl,
              file_size: candidate.videoFile.size,
            });

            await supabase.from('candidate_documents').insert({
              candidate_id: candidateId,
              document_type: 'video',
              filename: candidate.videoFile.name,
              file_url: urlData.publicUrl,
              file_size: candidate.videoFile.size,
            });
          }
        }

        results.push({ candidateId, applicationId });
      }

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['form-responses'] });
      toast({
        title: 'Upload Complete',
        description: `${data.length} candidates uploaded with form responses`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
