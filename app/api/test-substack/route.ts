import { NextRequest, NextResponse } from 'next/server';

/**
 * Temporary connectivity test — DELETE after confirming Substack is reachable from Vercel.
 * Usage: GET /api/test-substack?secret=<CRON_SECRET>
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publication = process.env.SUBSTACK_PUBLICATION ?? 'annebenven';
  const url = `https://${publication}.substack.com/api/v1/free?nojs=true`;

  // Use an RFC 2606 reserved address — guaranteed not a real person
  const body = new URLSearchParams({ email: 'vercel-test@example.com', source: 'subscribe_page' });

  let status: number;
  let responseBody: string;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': `https://${publication}.substack.com`,
        'Referer': `https://${publication}.substack.com/`,
      },
      body: body.toString(),
    });
    status = res.status;
    responseBody = await res.text();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({
    substack_status: status,
    substack_body: responseBody.slice(0, 300),
    cloudflare_blocked: status === 403 && responseBody.includes('Cloudflare'),
  });
}
