import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Authentication required.' }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Supabase function environment is incomplete.' }, { status: 500, headers: corsHeaders });
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: 'Invalid session.' }, { status: 401, headers: corsHeaders });
  }

  const { data: admin } = await client.from('admin_users')
    .select('user_id').eq('user_id', userData.user.id).maybeSingle();
  if (!admin) {
    return Response.json({ error: 'Administrator access required.' }, { status: 403, headers: corsHeaders });
  }

  return Response.json({
    error: 'SMS provider adapter is not configured yet.',
    next: 'Add the provider request format after SMS_API_URL, SMS_API_KEY, and SMS_SENDER_ID are supplied.'
  }, { status: 501, headers: corsHeaders });
});
