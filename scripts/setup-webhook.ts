/**
 * One-time setup script: creates a native Simplero webhook pointing at this app.
 * Run after deploying to Vercel:
 *   VERCEL_URL=https://your-app.vercel.app npm run setup-webhook
 *
 * The webhook will be listed under Simplero admin > Integrations > Webhooks.
 * Then attach it as an action step in the welcome series automation.
 */
import 'dotenv/config';

const apiKey = process.env.SIMPLERO_API_KEY;
const webhookSecret = process.env.SIMPLERO_WEBHOOK_SECRET;
const vercelUrl = process.env.VERCEL_URL;

if (!apiKey || !webhookSecret || !vercelUrl) {
  console.error('Required: SIMPLERO_API_KEY, SIMPLERO_WEBHOOK_SECRET, VERCEL_URL');
  process.exit(1);
}

const targetUrl = `${vercelUrl}/api/webhooks/simplero?secret=${webhookSecret}`;

const credentials = Buffer.from(`${apiKey}:`).toString('base64');

const res = await fetch('https://simplero.com/api/v1/webhooks.json', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'User-Agent': 'simplero-substack-sync (adam@magicalteams.com)',
  },
  body: JSON.stringify({ target_url: targetUrl }),
});

if (!res.ok) {
  console.error('Failed:', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log('Webhook created:', data);
console.log('Target URL:', targetUrl);
console.log('\nNext step: attach this webhook as the final action step in the welcome series automation.');
