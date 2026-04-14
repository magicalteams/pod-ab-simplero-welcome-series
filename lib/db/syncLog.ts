import { createClient } from '@supabase/supabase-js';

export type SyncSource = 'webhook' | 'cron' | 'backfill';

export interface QueuedContact {
  contact_id: number;
  email: string;
  name: string | null;
  queued_at: string;
  source: SyncSource;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

export async function isAlreadyQueued(contactId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('export_queue')
    .select('contact_id')
    .eq('contact_id', contactId)
    .maybeSingle();
  return data !== null;
}

export async function queueForExport(
  contactId: number,
  email: string,
  name: string | null,
  source: SyncSource,
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('export_queue')
    .upsert(
      { contact_id: contactId, email, name, source },
      { onConflict: 'contact_id', ignoreDuplicates: true },
    );
}

export async function listUnexported(): Promise<QueuedContact[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('export_queue')
    .select('contact_id, email, name, queued_at, source')
    .is('exported_at', null)
    .order('queued_at', { ascending: true });
  if (error) throw new Error(`listUnexported failed: ${error.message}`);
  return (data ?? []) as QueuedContact[];
}

export async function markExported(contactIds: number[], batchId: string): Promise<void> {
  if (contactIds.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('export_queue')
    .update({ exported_at: new Date().toISOString(), export_batch_id: batchId })
    .in('contact_id', contactIds);
  if (error) throw new Error(`markExported failed: ${error.message}`);
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
