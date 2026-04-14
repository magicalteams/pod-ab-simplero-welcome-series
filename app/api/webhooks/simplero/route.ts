import { NextRequest, NextResponse } from 'next/server';
import { SimpleroTaggingPayloadSchema } from '@/schemas/simpleroWebhook';
import { subscribeToSubstack } from '@/lib/SubstackSubscriber';
import { isAlreadySynced, insertSyncLog } from '@/lib/db/syncLog';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Shared-secret auth: Simplero appends ?secret=... to the target URL we register
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.SIMPLERO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SimpleroTaggingPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    console.error('[simplero-webhook] Zod parse failure', parsed.error.flatten());
    return NextResponse.json({ error: 'Bad payload', issues: parsed.error.flatten() }, { status: 422 });
  }

  const { id: contactId, email } = parsed.data;

  // Idempotency check — deduplicate if Simplero fires the webhook more than once
  if (await isAlreadySynced(contactId)) {
    return NextResponse.json({ status: 'already_synced' });
  }

  const result = await subscribeToSubstack(email);
  if (!result.success) {
    console.error(`[simplero-webhook] Substack subscribe failed for ${email} (HTTP ${result.status})`);
    return NextResponse.json({ error: 'Substack subscribe failed' }, { status: 502 });
  }

  await insertSyncLog(contactId, email, 'webhook');
  console.log(`[simplero-webhook] Synced ${email} (contact ${contactId})`);

  return NextResponse.json({ status: 'synced', email });
}
