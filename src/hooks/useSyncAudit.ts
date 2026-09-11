import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SyncAuditLog {
  id: string;
  sync_type: string;
  table_name: string;
  records_synced: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  error_message: string | null;
  created_by: string | null;
}

export function useSyncAuditLogs(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sync-audit-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SyncAuditLog[];
    },
    enabled: !!user
  });
}

export function useLastSuccessfulSync() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-successful-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SyncAuditLog | null;
    },
    enabled: !!user
  });
}
