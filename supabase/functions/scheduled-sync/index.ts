import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables in FK order
const SYNC_TABLES = [
  'profiles', 'user_roles', 'jobs', 'forms', 'form_versions',
  'candidates', 'candidate_documents', 'applications', 'application_documents',
  'form_responses', 'ai_evaluations', 'candidate_notes', 'notes', 'activity_log'
];

interface SyncResult {
  table_name: string;
  records_synced: number;
  records_failed: number;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[scheduled-sync] Starting scheduled sync...');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const personalUrl = Deno.env.get('PERSONAL_SUPABASE_URL');
  const personalKey = Deno.env.get('PERSONAL_SUPABASE_SERVICE_KEY');

  if (!personalUrl || !personalKey) {
    console.error('[scheduled-sync] Personal Supabase credentials not configured');
    return new Response(JSON.stringify({ 
      error: 'Personal Supabase credentials not configured' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const personalDb = createClient(personalUrl, personalKey);

  // Get sync type from request body or default to scheduled
  let syncType = 'scheduled';
  let tablesToSync = SYNC_TABLES;
  let onlyModifiedSince: string | null = null;

  try {
    const body = await req.json();
    syncType = body.sync_type || 'scheduled';
    if (body.tables) tablesToSync = body.tables;
    if (body.since) onlyModifiedSince = body.since;
  } catch {
    // No body, use defaults
  }

  // Create audit log entry
  const { data: auditLog, error: auditError } = await supabase
    .from('sync_audit_log')
    .insert({
      sync_type: syncType,
      table_name: 'all',
      status: 'running'
    })
    .select()
    .single();

  if (auditError) {
    console.error('[scheduled-sync] Failed to create audit log:', auditError);
  }

  const results: SyncResult[] = [];
  let totalSynced = 0;
  let totalFailed = 0;

  for (const tableName of tablesToSync) {
    console.log(`[scheduled-sync] Syncing ${tableName}...`);
    
    try {
      // Fetch data from source
      let query = supabase.from(tableName).select('*');
      
      // For scheduled syncs, only get recently modified records
      if (onlyModifiedSince && tableName !== 'profiles' && tableName !== 'user_roles') {
        query = query.gte('updated_at', onlyModifiedSince);
      }
      
      const { data: records, error: fetchError } = await query;

      if (fetchError) {
        console.error(`[scheduled-sync] Failed to fetch ${tableName}:`, fetchError);
        results.push({
          table_name: tableName,
          records_synced: 0,
          records_failed: 0,
          success: false,
          error: fetchError.message
        });
        totalFailed++;
        continue;
      }

      if (!records || records.length === 0) {
        console.log(`[scheduled-sync] No records to sync for ${tableName}`);
        results.push({
          table_name: tableName,
          records_synced: 0,
          records_failed: 0,
          success: true
        });
        continue;
      }

      // Upsert to personal DB
      const { error: upsertError } = await personalDb
        .from(tableName)
        .upsert(records, { onConflict: 'id' });

      if (upsertError) {
        console.error(`[scheduled-sync] Failed to upsert ${tableName}:`, upsertError);
        results.push({
          table_name: tableName,
          records_synced: 0,
          records_failed: records.length,
          success: false,
          error: upsertError.message
        });
        totalFailed++;
      } else {
        console.log(`[scheduled-sync] Synced ${records.length} records for ${tableName}`);
        results.push({
          table_name: tableName,
          records_synced: records.length,
          records_failed: 0,
          success: true
        });
        totalSynced += records.length;
      }
    } catch (err) {
      console.error(`[scheduled-sync] Error syncing ${tableName}:`, err);
      results.push({
        table_name: tableName,
        records_synced: 0,
        records_failed: 0,
        success: false,
        error: String(err)
      });
      totalFailed++;
    }
  }

  // Update audit log
  if (auditLog) {
    await supabase
      .from('sync_audit_log')
      .update({
        records_synced: totalSynced,
        records_failed: totalFailed,
        completed_at: new Date().toISOString(),
        status: totalFailed === 0 ? 'completed' : 'failed',
        error_message: totalFailed > 0 ? `${totalFailed} tables failed` : null
      })
      .eq('id', auditLog.id);
  }

  console.log(`[scheduled-sync] Sync complete. Synced: ${totalSynced}, Failed: ${totalFailed}`);

  return new Response(JSON.stringify({
    success: totalFailed === 0,
    total_synced: totalSynced,
    total_failed: totalFailed,
    results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
