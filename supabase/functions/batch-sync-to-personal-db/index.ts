import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to chunk arrays into batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    // Parse and validate request body
    const { records, target_table, operation = 'insert' } = await req.json()
    
    // Input validation
    if (!records || !Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid input: records must be a non-empty array' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!target_table || typeof target_table !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid input: target_table is required and must be a string' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!['insert', 'upsert'].includes(operation)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid operation: must be "insert" or "upsert"' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log(`Starting ${operation} operation for ${records.length} records to table: ${target_table}`)
    
    // Connect to personal Supabase using stored secrets
    const personalSupabaseUrl = Deno.env.get('PERSONAL_SUPABASE_URL')
    const personalSupabaseKey = Deno.env.get('PERSONAL_SUPABASE_SERVICE_KEY')
    
    if (!personalSupabaseUrl || !personalSupabaseKey) {
      console.error('Missing personal Supabase credentials')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error: missing database credentials' 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const personalSupabase = createClient(personalSupabaseUrl, personalSupabaseKey)
    
    // Batch processing
    const batchSize = 500
    const chunks = chunkArray(records, batchSize)
    
    let successCount = 0
    let failCount = 0
    const errors: any[] = []
    
    console.log(`Processing ${chunks.length} batches of up to ${batchSize} records each`)
    
    // Process each batch
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const batchNumber = i + 1
      
      try {
        let result
        
        if (operation === 'upsert') {
          result = await personalSupabase
            .from(target_table)
            .upsert(chunk)
        } else {
          result = await personalSupabase
            .from(target_table)
            .insert(chunk)
        }
        
        const { error } = result
        
        if (error) {
          failCount += chunk.length
          errors.push({ 
            batch: batchNumber,
            error: error.message,
            code: error.code,
            details: error.details,
            records_count: chunk.length 
          })
          console.error(`Batch ${batchNumber} failed:`, error.message)
        } else {
          successCount += chunk.length
          console.log(`Batch ${batchNumber}/${chunks.length} completed successfully: ${chunk.length} records`)
        }
        
      } catch (err: unknown) {
        failCount += chunk.length
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ 
          batch: batchNumber,
          error: errorMessage,
          records_count: chunk.length 
        })
        console.error(`Batch ${batchNumber} exception:`, err)
      }
    }
    
    const executionTime = Date.now() - startTime
    const allSuccessful = failCount === 0
    
    console.log(`Sync completed: ${successCount} successful, ${failCount} failed, ${executionTime}ms`)
    
    // Return comprehensive response
    return new Response(
      JSON.stringify({
        success: allSuccessful,
        total_records: records.length,
        successful: successCount,
        failed: failCount,
        batches_processed: chunks.length,
        errors: errors,
        execution_time_ms: executionTime,
        target_table: target_table,
        operation: operation
      }),
      { 
        status: allSuccessful ? 200 : 207, // 207 = Multi-Status (partial success)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error: unknown) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        message: errorMessage,
        execution_time_ms: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
