import { NextRequest, NextResponse } from 'next/server';
import { SimpleroTaggingPayloadSchema } from '@/schemas/simpleroWebhook';
import { isAlreadyQueued, queueForExport } from '@/lib/db/syncLog';

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const { id: contactId, email, name } = parsed.data;

  if (await isAlreadyQueued(contactId)) {
    return NextResponse.json({ status: 'already_queued' });
  }

  await queueForExport(contactId, email, name ?? null, 'webhook');
  console.log(`[simplero-webhook] Queued ${email} (contact ${contactId}) for monthly Substack export`);

  return NextResponse.json({ status: 'queued', email });
}
