interface SubscribeResult {
  success: boolean;
  status: number;
  message?: string;
}

/**
 * Subscribes an email address to the Substack publication as a free subscriber.
 *
 * Uses the authenticated Substack internal API with the publisher's session
 * cookie (SUBSTACK_SID env var). This approach bypasses Cloudflare bot
 * protection that blocks unauthenticated server-side requests.
 *
 * How to get SUBSTACK_SID:
 *   1. Log in to substack.com as Anne in Chrome
 *   2. Open DevTools → Application → Cookies → substack.com
 *   3. Copy the value of the `substack.sid` cookie
 *   4. Set it as SUBSTACK_SID in .env and Vercel environment variables
 *   Note: the cookie expires — renew it periodically (typically ~1 year).
 */
export async function subscribeToSubstack(email: string): Promise<SubscribeResult> {
  const publication = process.env.SUBSTACK_PUBLICATION ?? 'annebenven';
  const sid = process.env.SUBSTACK_SID;

  if (!sid) {
    return { success: false, status: 500, message: 'SUBSTACK_SID env var not set' };
  }

  const url = `https://substack.com/api/v1/email_list/subscribe`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `substack.sid=${sid}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Origin': 'https://substack.com',
      'Referer': 'https://substack.com/',
    },
    body: JSON.stringify({
      email,
      publication_id: publication,
      is_free: true,
    }),
  });

  const responseText = await res.text();

  // Fallback: if the primary endpoint doesn't work, try the public free endpoint
  // which may succeed from Vercel's data centre IPs even if blocked locally.
  if (!res.ok) {
    const fallbackUrl = `https://${publication}.substack.com/api/v1/free?nojs=true`;
    const fallbackBody = new URLSearchParams({ email, source: 'subscribe_page' });

    const fallback = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `substack.sid=${sid}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Origin': `https://${publication}.substack.com`,
        'Referer': `https://${publication}.substack.com/`,
      },
      body: fallbackBody.toString(),
    });

    return {
      success: fallback.ok,
      status: fallback.status,
      message: responseText,
    };
  }

  return { success: true, status: res.status };
}
