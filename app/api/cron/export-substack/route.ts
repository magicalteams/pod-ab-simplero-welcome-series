import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { SimpleroClient } from '@/lib/SimpleroClient';
import {
  getLastSyncedAt,
  isAlreadyQueued,
  listUnexported,
  markExported,
  queueForExport,
  setLastSyncedAt,
  type QueuedContact,
} from '@/lib/db/syncLog';
import { postEmptyRunToSlack, postExportToSlack } from '@/lib/slackExport';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(rows: QueuedContact[]): string {
  const header = 'email,name';
  const body = rows
    .map((r) => `${csvEscape(r.email)},${csvEscape(r.name ?? '')}`)
    .join('\n');
  return `${header}\n${body}\n`;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
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

  // Fallback sweep: catch any completers the webhook missed since the last run.
  let sweepAdded = 0;
  for await (const contact of client.paginateContactsByTag(tagId, lastSyncedAt)) {
    if (await isAlreadyQueued(contact.id)) continue;
    await queueForExport(contact.id, contact.email, contact.name ?? null, 'cron');
    sweepAdded++;
  }

  const queued = await listUnexported();

  if (queued.length === 0) {
    await postEmptyRunToSlack({
      rangeStart: formatDate(lastSyncedAt),
      rangeEnd: formatDate(runStartedAt),
    });
    await setLastSyncedAt(runStartedAt);
    const summary = { exported: 0, sweepAdded, runStartedAt };
    console.log('[export-cron] Empty run', summary);
    return NextResponse.json(summary);
  }

  const batchId = randomUUID();
  const csv = buildCsv(queued);
  const filename = `substack-import-${formatDate(runStartedAt)}.csv`;

  await postExportToSlack({
    csv,
    filename,
    rowCount: queued.length,
    rangeStart: formatDate(lastSyncedAt),
    rangeEnd: formatDate(runStartedAt),
  });

  await markExported(
    queued.map((r) => r.contact_id),
    batchId,
  );
  await setLastSyncedAt(runStartedAt);

  const summary = { exported: queued.length, sweepAdded, batchId, runStartedAt };
  console.log('[export-cron] Complete', summary);
  return NextResponse.json(summary);
}
