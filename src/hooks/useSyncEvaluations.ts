import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  total?: number;
  errors?: string[];
}

export function useSyncEvaluations(jobId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncEvaluations = async (): Promise<SyncResult | null> => {
    setIsSyncing(true);
    
    try {
      console.log('🔄 Triggering evaluation sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-evaluations');

      if (error) {
        console.error('❌ Sync error:', error);
        toast({
          title: "Sync Failed",
          description: error.message || "Could not sync evaluations from personal database",
          variant: "destructive",
        });
        return null;
      }

      const result = data as SyncResult;
      console.log('✅ Sync result:', result);

      if (result.success) {
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
        if (jobId) {
          queryClient.invalidateQueries({ queryKey: ['candidates', 'job', jobId] });
        }
        queryClient.invalidateQueries({ queryKey: ['candidate'] });

        if (result.synced > 0) {
          toast({
            title: "Evaluations Synced",
            description: `Successfully synced ${result.synced} evaluation${result.synced > 1 ? 's' : ''}`,
          });
        } else {
          toast({
            title: "No New Evaluations",
            description: "All evaluations are already synced",
          });
        }

        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ Some evaluations had errors:', result.errors);
        }
      } else {
        toast({
          title: "Sync Failed",
          description: result.message || "Could not sync evaluations",
          variant: "destructive",
        });
      }

      return result;

    } catch (err) {
      console.error('❌ Unexpected sync error:', err);
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred while syncing",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncEvaluations,
    isSyncing,
  };
}
