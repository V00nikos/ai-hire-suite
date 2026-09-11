import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncPayload {
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[realtime-sync] Received webhook');

  const personalUrl = Deno.env.get('PERSONAL_SUPABASE_URL');
  const personalKey = Deno.env.get('PERSONAL_SUPABASE_SERVICE_KEY');

  if (!personalUrl || !personalKey) {
    console.error('[realtime-sync] Personal Supabase credentials not configured');
    return new Response(JSON.stringify({ 
      error: 'Personal Supabase credentials not configured' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const personalDb = createClient(personalUrl, personalKey);

  let payload: SyncPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('[realtime-sync] Invalid JSON payload:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { table, record, old_record, type } = payload;

  console.log(`[realtime-sync] Processing ${type} on ${table}`);

  // Handle schema differences between primary and personal DBs
  // Remove columns that may not exist in the target database
  const sanitizeRecord = (tableName: string, rec: Record<string, unknown>): Record<string, unknown> => {
    const sanitized = { ...rec };
    
    // application_documents may not have file_size in personal DB
    if (tableName === 'application_documents') {
      delete sanitized.file_size;
    }
    
    return sanitized;
  };

  try {
    if (type === 'DELETE' && old_record) {
      const { error } = await personalDb
        .from(table)
        .delete()
        .eq('id', old_record.id);

      if (error) {
        console.error(`[realtime-sync] Delete failed:`, error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (record) {
      // Sanitize record to handle schema differences
      const cleanRecord = sanitizeRecord(table, record);
      
      // For INSERT or UPDATE, use upsert
      const { error } = await personalDb
        .from(table)
        .upsert(cleanRecord, { onConflict: 'id' });

      if (error) {
        console.error(`[realtime-sync] Upsert failed:`, error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`[realtime-sync] Successfully synced ${type} on ${table}`);

    // Log the sync in audit
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('sync_audit_log').insert({
      sync_type: 'realtime',
      table_name: table,
      records_synced: 1,
      records_failed: 0,
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    // ========================================
    // REVERSE SYNC: Pull AI Evaluations FROM Personal DB
    // ========================================
    let evaluationsSynced = 0;

    // Only check for evaluations when application-related data is synced
    if (['applications', 'form_responses', 'application_documents'].includes(table)) {
      console.log('[realtime-sync] 🔄 Checking for AI evaluations to sync FROM personal DB...');
      
      try {
        // Fetch unsynced evaluations from personal DB
        const evaluationsResponse = await fetch(
          `${personalUrl}/rest/v1/ai_evaluations?synced_to_lovable=eq.false&select=*`,
          {
            headers: {
              'apikey': personalKey,
              'Authorization': `Bearer ${personalKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (evaluationsResponse.ok) {
          const evaluationsToSync = await evaluationsResponse.json();
          
          if (evaluationsToSync.length > 0) {
            console.log(`[realtime-sync] 📊 Found ${evaluationsToSync.length} evaluations to sync to Lovable`);

            for (const evaluation of evaluationsToSync) {
              try {
                console.log(`[realtime-sync] 📥 Syncing evaluation for application: ${evaluation.application_id}`);

                // 1. Upsert evaluation into Lovable Supabase
                const { error: evalUpsertError } = await supabase
                  .from('ai_evaluations')
                  .upsert({
                    application_id: evaluation.application_id,
                    resume_score: evaluation.resume_score,
                    video_score: evaluation.video_score,
                    overall_score: evaluation.overall_score,
                    score: evaluation.overall_score, // Map to legacy score field
                    summary: evaluation.summary,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    interview_questions: evaluation.interview_questions,
                    rubric_scores: evaluation.rubric_scores,
                    raw_response: evaluation.raw_analysis_data, // Map to existing raw_response column
                    model_used: evaluation.model_used,
                    recommendation: evaluation.recommendation,
                    hiring_manager_notes: evaluation.hiring_manager_notes,
                    evaluated_at: evaluation.evaluated_at
                  }, {
                    onConflict: 'application_id'
                  });

                if (evalUpsertError) {
                  console.error(`[realtime-sync] ❌ Failed to upsert evaluation: ${evalUpsertError.message}`);
                  continue;
                }

                // 2. Update application status to 'evaluated'
                const { error: statusUpdateError } = await supabase
                  .from('applications')
                  .update({ status: 'evaluated' })
                  .eq('id', evaluation.application_id);

                if (statusUpdateError) {
                  console.warn(`[realtime-sync] ⚠️ Failed to update application status: ${statusUpdateError.message}`);
                }

                // 3. Calculate and update ranking within job
                const { data: application } = await supabase
                  .from('applications')
                  .select('job_id')
                  .eq('id', evaluation.application_id)
                  .single();

                if (application?.job_id) {
                  // Get all application IDs for this job
                  const { data: jobApplications } = await supabase
                    .from('applications')
                    .select('id')
                    .eq('job_id', application.job_id);

                  if (jobApplications && jobApplications.length > 0) {
                    const applicationIds = jobApplications.map(a => a.id);

                    // Get all evaluations for this job, ordered by score
                    const { data: jobEvaluations } = await supabase
                      .from('ai_evaluations')
                      .select('application_id, overall_score')
                      .in('application_id', applicationIds)
                      .order('overall_score', { ascending: false, nullsFirst: false });

                    // Assign rankings
                    if (jobEvaluations && jobEvaluations.length > 0) {
                      for (let i = 0; i < jobEvaluations.length; i++) {
                        await supabase
                          .from('ai_evaluations')
                          .update({ ranking: i + 1 })
                          .eq('application_id', jobEvaluations[i].application_id);
                      }
                      console.log(`[realtime-sync] 📊 Updated rankings for ${jobEvaluations.length} candidates in job ${application.job_id}`);
                    }
                  }
                }

                // 4. Create activity log entry
                await supabase
                  .from('activity_log')
                  .insert({
                    event_type: 'ai_evaluation_completed',
                    application_id: evaluation.application_id,
                    job_id: application?.job_id,
                    event_data: {
                      overall_score: evaluation.overall_score,
                      resume_score: evaluation.resume_score,
                      video_score: evaluation.video_score,
                      recommendation: evaluation.recommendation
                    }
                  });

                // 5. Mark as synced in personal DB
                const markSyncedResponse = await fetch(
                  `${personalUrl}/rest/v1/ai_evaluations?application_id=eq.${evaluation.application_id}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'apikey': personalKey,
                      'Authorization': `Bearer ${personalKey}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                      synced_to_lovable: true,
                      synced_at: new Date().toISOString()
                    })
                  }
                );

                if (markSyncedResponse.ok) {
                  evaluationsSynced++;
                  console.log(`[realtime-sync] ✅ Successfully synced evaluation for application ${evaluation.application_id}`);
                } else {
                  console.error(`[realtime-sync] ❌ Failed to mark evaluation as synced in personal DB`);
                }

              } catch (evalError) {
                console.error(`[realtime-sync] ❌ Error syncing evaluation ${evaluation.application_id}:`, evalError);
              }
            }
          } else {
            console.log('[realtime-sync] ℹ️ No new evaluations to sync');
          }
        } else {
          console.error(`[realtime-sync] ❌ Failed to fetch evaluations from personal DB: ${evaluationsResponse.statusText}`);
        }
      } catch (reverseError) {
        console.error('[realtime-sync] ❌ Reverse sync error:', reverseError);
        // Don't throw - reverse sync errors shouldn't block the main sync
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      table, 
      type,
      synced: 1,
      evaluationsSynced
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(`[realtime-sync] Error:`, err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(err) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
