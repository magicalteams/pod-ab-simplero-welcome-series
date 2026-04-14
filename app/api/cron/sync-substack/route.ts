import { NextRequest, NextResponse } from 'next/server';
import { SimpleroClient } from '@/lib/SimpleroClient';
import { subscribeToSubstack } from '@/lib/SubstackSubscriber';
import { isAlreadySynced, insertSyncLog, getLastSyncedAt, setLastSyncedAt } from '@/lib/db/syncLog';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.SIMPLERO_API_KEY;
  const tagId = Number(process.env.SIMPLERO_TAG_ID);
  if (!apiKey || !tagId) {
    return NextResponse.json({ error: 'Missing SIMPLERO_API_KEY or SIMPLERO_TAG_ID' }, { status: 500 });
  }

  const client = new SimpleroClient(apiKey);
  const lastSyncedAt = await getLastSyncedAt();
  const runStartedAt = new Date().toISOString();

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for await (const contact of client.paginateContactsByTag(tagId, lastSyncedAt)) {
    if (await isAlreadySynced(contact.id)) {
      skipped++;
      continue;
    }

    const result = await subscribeToSubstack(contact.email);
    if (result.success) {
      await insertSyncLog(contact.id, contact.email, 'cron');
      synced++;
    } else {
      console.error(`[sync-cron] Failed to subscribe ${contact.email} (HTTP ${result.status})`);
      failed++;
    }
  }

  await setLastSyncedAt(runStartedAt);

  const summary = { synced, skipped, failed, runStartedAt };
  console.log('[sync-cron] Complete', summary);
  return NextResponse.json(summary);
}
