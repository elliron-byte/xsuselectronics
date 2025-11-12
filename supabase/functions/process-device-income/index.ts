import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  daily_income: string;
  last_payout_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automated device income processing...');

    // Find all devices that are eligible for payout (24 hours have passed)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: eligibleDevices, error: fetchError } = await supabase
      .from('user_devices')
      .select('id, user_id, device_name, daily_income, last_payout_at')
      .lte('last_payout_at', twentyFourHoursAgo);

    if (fetchError) {
      console.error('Error fetching devices:', fetchError);
      throw fetchError;
    }

    if (!eligibleDevices || eligibleDevices.length === 0) {
      console.log('No devices eligible for payout at this time');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No devices eligible for payout',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleDevices.length} devices eligible for payout`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each device using secure database function
    for (const device of eligibleDevices as Device[]) {
      try {
        // Call the secure credit_device_income function with proper locking
        const { data: result, error } = await supabase.rpc('credit_device_income', {
          p_device_id: device.id
        });

        if (error) {
          console.error(`Error processing device ${device.id}:`, error);
          errorCount++;
          errors.push(`Device ${device.id}: ${error.message}`);
          continue;
        }

        if (result && result.success) {
          console.log(`Successfully processed device ${device.id} for user ${device.user_id}: credited ${result.amount}`);
          successCount++;
        } else {
          console.log(`Skipped device ${device.id}: ${result?.error || 'Unknown reason'}`);
        }
      } catch (deviceError) {
        console.error(`Unexpected error processing device ${device.id}:`, deviceError);
        errorCount++;
        errors.push(`Device ${device.id}: Unexpected error`);
      }
    }

    const result = {
      success: true,
      message: `Processed ${successCount} devices successfully, ${errorCount} errors`,
      processed: successCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    };

    console.log('Income processing complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error in process-device-income:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
