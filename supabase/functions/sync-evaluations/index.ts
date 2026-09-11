import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonalEvaluation {
  id: string;
  application_id: string;
  score: number;
  ranking: number | null;
  summary: string;
  strengths: any;
  weaknesses: any;
  recommendation: string;
  interview_questions: any;
  rubric_scores: any;
  model_used: string;
  evaluated_at: string;
  synced_to_lovable: boolean;
  resume_score: number | null;
  video_score: number | null;
  overall_score: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting evaluation sync from personal Supabase');

    // Get personal Supabase credentials
    const personalUrl = Deno.env.get('PERSONAL_SUPABASE_URL');
    const personalKey = Deno.env.get('PERSONAL_SUPABASE_SERVICE_KEY');

    if (!personalUrl || !personalKey) {
      throw new Error('Personal Supabase credentials not configured');
    }

    // Get Lovable Supabase credentials
    const lovableUrl = Deno.env.get('SUPABASE_URL');
    const lovableKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!lovableUrl || !lovableKey) {
      throw new Error('Lovable Supabase credentials not configured');
    }

    // Create clients
    const personalSupabase = createClient(personalUrl, personalKey);
    const lovableSupabase = createClient(lovableUrl, lovableKey);

    // Fetch unsynced evaluations from personal Supabase
    console.log('📥 Fetching unsynced evaluations from personal Supabase');
    const { data: unsyncedEvaluations, error: fetchError } = await personalSupabase
      .from('ai_evaluations')
      .select('*')
      .eq('synced_to_lovable', false);

    if (fetchError) {
      console.error('❌ Error fetching evaluations:', fetchError);
      throw fetchError;
    }

    if (!unsyncedEvaluations || unsyncedEvaluations.length === 0) {
      console.log('✅ No unsynced evaluations found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No evaluations to sync',
          synced: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${unsyncedEvaluations.length} unsynced evaluations`);

    let syncedCount = 0;
    const errors: string[] = [];
    const syncedIds: string[] = [];

    // Process each evaluation
    for (const evaluation of unsyncedEvaluations as PersonalEvaluation[]) {
      try {
        console.log(`🔄 Processing evaluation for application: ${evaluation.application_id}`);

        // Prepare evaluation data for Lovable (exclude personal-specific fields)
        const evaluationData = {
          application_id: evaluation.application_id,
          score: evaluation.score,
          ranking: evaluation.ranking,
          summary: evaluation.summary,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          recommendation: evaluation.recommendation,
          interview_questions: evaluation.interview_questions,
          rubric_scores: evaluation.rubric_scores,
          model_used: evaluation.model_used,
          evaluated_at: evaluation.evaluated_at,
          resume_score: evaluation.resume_score,
          video_score: evaluation.video_score,
          overall_score: evaluation.overall_score,
        };

        // Upsert evaluation into Lovable
        const { error: upsertError } = await lovableSupabase
          .from('ai_evaluations')
          .upsert(evaluationData, { 
            onConflict: 'application_id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`❌ Error upserting evaluation:`, upsertError);
          errors.push(`Application ${evaluation.application_id}: ${upsertError.message}`);
          continue;
        }

        // Update application status to 'evaluated'
        const { error: statusError } = await lovableSupabase
          .from('applications')
          .update({ status: 'evaluated' })
          .eq('id', evaluation.application_id);

        if (statusError) {
          console.warn(`⚠️ Could not update application status:`, statusError);
          // Don't fail the sync for this
        }

        syncedIds.push(evaluation.id);
        syncedCount++;
        console.log(`✅ Synced evaluation for application: ${evaluation.application_id}`);

      } catch (err) {
        console.error(`❌ Error processing evaluation:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push(`Application ${evaluation.application_id}: ${errorMessage}`);
      }
    }

    // Mark evaluations as synced in personal Supabase
    if (syncedIds.length > 0) {
      console.log(`📝 Marking ${syncedIds.length} evaluations as synced in personal Supabase`);
      const { error: markError } = await personalSupabase
        .from('ai_evaluations')
        .update({ synced_to_lovable: true })
        .in('id', syncedIds);

      if (markError) {
        console.error('⚠️ Error marking evaluations as synced:', markError);
        // Don't fail the sync for this
      }
    }

    // Calculate rankings per job
    console.log('📊 Recalculating rankings per job');
    const { data: applications, error: appError } = await lovableSupabase
      .from('applications')
      .select('id, job_id')
      .in('id', unsyncedEvaluations.map((e: PersonalEvaluation) => e.application_id));

    if (!appError && applications) {
      const jobIds = [...new Set(applications.map(a => a.job_id))];
      
      for (const jobId of jobIds) {
        // Get all evaluations for this job, ordered by score
        const { data: jobEvaluations, error: evalError } = await lovableSupabase
          .from('ai_evaluations')
          .select(`
            id,
            score,
            application_id,
            applications!inner(job_id)
          `)
          .eq('applications.job_id', jobId)
          .order('score', { ascending: false });

        if (!evalError && jobEvaluations) {
          // Update rankings
          for (let i = 0; i < jobEvaluations.length; i++) {
            await lovableSupabase
              .from('ai_evaluations')
              .update({ ranking: i + 1 })
              .eq('id', jobEvaluations[i].id);
          }
          console.log(`✅ Updated rankings for job ${jobId}: ${jobEvaluations.length} candidates`);
        }
      }
    }

    console.log(`🎉 Sync complete: ${syncedCount}/${unsyncedEvaluations.length} evaluations synced`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${syncedCount} evaluations`,
        synced: syncedCount,
        total: unsyncedEvaluations.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
