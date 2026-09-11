import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAIEvaluationRealtime(jobId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔌 Setting up AI evaluation realtime subscription');
    
    const channel = supabase
      .channel('ai-evaluations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_evaluations'
        },
        (payload) => {
          console.log('🔔 AI Evaluation update received:', payload);
          
          // Invalidate candidates queries to refetch with new evaluation data
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
          
          if (jobId) {
            queryClient.invalidateQueries({ queryKey: ['candidates', 'job', jobId] });
          }
          
          // Also invalidate individual candidate query if we have the application_id
          if (payload.new && typeof payload.new === 'object' && 'application_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['candidate'] });
          }
          
          // Show toast notification for new evaluations
          if (payload.eventType === 'INSERT') {
            toast({
              title: "AI Evaluation Complete",
              description: "A candidate has been evaluated. Scores updated.",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up AI evaluation realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [jobId, queryClient, toast]);
}
