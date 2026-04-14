const SUBSTACK_BASE = 'https://annebenven.substack.com';

interface SubscribeResult {
  success: boolean;
  status: number;
}

/**
 * Subscribes an email address to the Substack publication as a free subscriber.
 * Uses the undocumented but stable public subscribe endpoint.
 */
export async function subscribeToSubstack(email: string): Promise<SubscribeResult> {
  const publication = process.env.SUBSTACK_PUBLICATION ?? 'annebenven';
  const url = `https://${publication}.substack.com/api/v1/free?nojs=true`;

  const body = new URLSearchParams({ email, source: 'subscribe_page' });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: body.toString(),
  });

  return { success: res.ok, status: res.status };
}
