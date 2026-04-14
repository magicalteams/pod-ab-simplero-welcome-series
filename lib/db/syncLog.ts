import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

export async function isAlreadySynced(contactId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('sync_log')
    .select('id')
    .eq('contact_id', contactId)
    .maybeSingle();
  return data !== null;
}

export async function insertSyncLog(
  contactId: number,
  email: string,
  source: 'webhook' | 'cron' | 'backfill',
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('sync_log').insert({ contact_id: contactId, email, source });
}

export async function getLastSyncedAt(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('sync_config')
    .select('value')
    .eq('key', 'last_synced_at')
    .single();
  return data?.value ?? '2020-01-01T00:00:00Z';
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('sync_config')
    .upsert({ key: 'last_synced_at', value: iso }, { onConflict: 'key' });
}
