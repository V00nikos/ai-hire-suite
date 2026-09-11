import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  total_records: number;
  successful: number;
  failed: number;
  batches_processed: number;
  errors: Array<{ batch: number; error: string; records_count: number }>;
  execution_time_ms: number;
  target_table: string;
  operation: string;
}

interface SyncOptions {
  tableName: string;
  operation?: 'insert' | 'upsert';
}

// Tables in order of sync (respecting foreign key dependencies)
// CRITICAL: profiles and user_roles MUST be synced first as they are referenced by jobs.created_by and other FKs
export const SYNC_TABLES = [
  // Auth-related tables (must be synced first - no dependencies)
  { name: 'profiles', label: 'Profiles', hasDependencies: false },
  { name: 'user_roles', label: 'User Roles', hasDependencies: true },
  
  // Job-related tables (jobs depends on profiles.id via created_by)
  { name: 'jobs', label: 'Jobs', hasDependencies: true },
  { name: 'forms', label: 'Forms', hasDependencies: true },
  { name: 'form_versions', label: 'Form Versions', hasDependencies: true },
  
  // Candidate tables (candidates has no FK dependencies)
  { name: 'candidates', label: 'Candidates', hasDependencies: false },
  { name: 'candidate_documents', label: 'Candidate Documents', hasDependencies: true },
  
  // Application tables (depends on jobs + candidates)
  { name: 'applications', label: 'Applications', hasDependencies: true },
  { name: 'application_documents', label: 'Application Documents', hasDependencies: true },
  { name: 'form_responses', label: 'Form Responses', hasDependencies: true },
  { name: 'ai_evaluations', label: 'AI Evaluations', hasDependencies: true },
  
  // Notes tables (depends on candidates, applications, profiles)
  { name: 'candidate_notes', label: 'Candidate Notes', hasDependencies: true },
  { name: 'notes', label: 'Notes', hasDependencies: true },
  
  // Activity tracking (depends on multiple tables)
  { name: 'activity_log', label: 'Activity Log', hasDependencies: true },
] as const;

export type SyncTableName = typeof SYNC_TABLES[number]['name'];

async function fetchTableData(tableName: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(tableName as any)
    .select('*');
  
  if (error) {
    throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
  }
  
  return data || [];
}

async function syncToPersonalDb(records: any[], tableName: string, operation: 'insert' | 'upsert'): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('batch-sync-to-personal-db', {
    body: {
      records,
      target_table: tableName,
      operation,
    },
  });
  
  if (error) {
    throw new Error(`Sync failed: ${error.message}`);
  }
  
  return data as SyncResult;
}

export function useSyncTable() {
  return useMutation({
    mutationFn: async ({ tableName, operation = 'upsert' }: SyncOptions) => {
      // Fetch data from local Supabase
      const records = await fetchTableData(tableName);
      
      if (records.length === 0) {
        return {
          success: true,
          total_records: 0,
          successful: 0,
          failed: 0,
          batches_processed: 0,
          errors: [],
          execution_time_ms: 0,
          target_table: tableName,
          operation,
        } as SyncResult;
      }
      
      // Sync to personal Supabase
      return syncToPersonalDb(records, tableName, operation);
    },
    onSuccess: (result) => {
      if (result.total_records === 0) {
        toast.info(`No records to sync in ${result.target_table}`);
      } else if (result.success) {
        toast.success(`Synced ${result.successful} records to ${result.target_table}`);
      } else {
        toast.warning(`Partial sync: ${result.successful}/${result.total_records} records synced to ${result.target_table}`);
      }
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

export function useSyncAllTables() {
  return useMutation({
    mutationFn: async (operation: 'insert' | 'upsert' = 'upsert') => {
      const results: SyncResult[] = [];
      
      // Sync tables in order (respecting foreign key dependencies)
      for (const table of SYNC_TABLES) {
        try {
          const records = await fetchTableData(table.name);
          
          if (records.length === 0) {
            results.push({
              success: true,
              total_records: 0,
              successful: 0,
              failed: 0,
              batches_processed: 0,
              errors: [],
              execution_time_ms: 0,
              target_table: table.name,
              operation,
            });
            continue;
          }
          
          const result = await syncToPersonalDb(records, table.name, operation);
          results.push(result);
          
        } catch (error: any) {
          results.push({
            success: false,
            total_records: 0,
            successful: 0,
            failed: 0,
            batches_processed: 0,
            errors: [{ batch: 0, error: error.message, records_count: 0 }],
            execution_time_ms: 0,
            target_table: table.name,
            operation,
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const totalSuccess = results.reduce((sum, r) => sum + r.successful, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      
      if (totalFailed === 0) {
        toast.success(`Full sync complete: ${totalSuccess} records synced across ${results.length} tables`);
      } else {
        toast.warning(`Sync complete with issues: ${totalSuccess} synced, ${totalFailed} failed`);
      }
    },
    onError: (error) => {
      toast.error(`Full sync failed: ${error.message}`);
    },
  });
}
