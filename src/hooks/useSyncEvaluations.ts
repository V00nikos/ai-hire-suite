import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  synced: number;
  total: number;
}

// Scores every application for the job that has no AI evaluation yet (normally the
// on_application_created trigger does this; this is the manual catch-up).
export function useSyncEvaluations(jobId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncEvaluations = async (): Promise<SyncResult | null> => {
    if (!jobId) return null;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, ai_evaluations(id)')
        .eq('job_id', jobId);
      if (error) throw error;

      const pending = (data || []).filter((a: any) => !a.ai_evaluations).map((a) => a.id);
      if (pending.length === 0) {
        toast({ title: "All candidates are scored", description: "Every application for this job has an AI evaluation." });
        return { success: true, synced: 0, total: 0 };
      }

      toast({ title: `Scoring ${pending.length} candidate${pending.length > 1 ? 's' : ''}…`, description: "Results appear in the list as they land." });
      const results = await Promise.allSettled(
        pending.map((id) => supabase.functions.invoke('evaluate-application', { body: { application_id: id } })),
      );
      const synced = results.filter((r) => r.status === 'fulfilled' && !r.value.error && !r.value.data?.error).length;

      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
      toast({
        title: synced === pending.length ? "Scoring complete" : "Scoring finished with errors",
        description: `${synced} of ${pending.length} candidates scored.`,
        variant: synced === pending.length ? undefined : "destructive",
      });
      return { success: synced === pending.length, synced, total: pending.length };
    } catch (e) {
      toast({
        title: "Scoring failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncEvaluations, isSyncing };
}
