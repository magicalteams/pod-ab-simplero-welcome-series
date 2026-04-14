/**
 * One-time backfill: seeds the export_queue with historical Simplero contacts
 * tagged "Welcome Series - Substack Synced", then produces the first Slack CSV drop
 * by invoking the export cron endpoint.
 *
 * Idempotent — queueForExport upserts on contact_id, so safe to re-run.
 *
 * Prerequisites:
 *   SIMPLERO_API_KEY, SIMPLERO_TAG_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CRON_SECRET, and an EXPORT_TRIGGER_URL pointing at the deployed export cron
 *   (e.g. https://<project>.vercel.app/api/cron/export-substack).
 *
 * Run:
 *   npm run backfill
 */
import 'dotenv/config';
import { SimpleroClient } from '../lib/SimpleroClient';
import { isAlreadyQueued, queueForExport } from '../lib/db/syncLog';

const apiKey = process.env.SIMPLERO_API_KEY;
const tagId = Number(process.env.SIMPLERO_TAG_ID);
const cronSecret = process.env.CRON_SECRET;
const triggerUrl = process.env.EXPORT_TRIGGER_URL;

if (!apiKey || !tagId) {
  console.error('Required: SIMPLERO_API_KEY, SIMPLERO_TAG_ID');
  process.exit(1);
}

const client = new SimpleroClient(apiKey);

let queued = 0;
let skipped = 0;

const { contacts: firstPage } = await client.getContactsByTagId(tagId);
console.log(`Starting backfill — found at least ${firstPage.length} contacts with tag_id=${tagId}`);
console.log('(Will paginate through all pages automatically)\n');

for await (const contact of client.paginateContactsByTag(tagId)) {
  if (await isAlreadyQueued(contact.id)) {
    skipped++;
    continue;
  }

  await queueForExport(contact.id, contact.email, contact.name ?? null, 'backfill');
  queued++;
  console.log(`  + ${contact.email}`);
}

console.log(`\nQueue seeding complete: ${queued} queued, ${skipped} already queued.`);

if (queued === 0) {
  console.log('Nothing new queued — skipping export trigger.');
  process.exit(0);
}

if (!triggerUrl || !cronSecret) {
  console.log(
    '\nSet EXPORT_TRIGGER_URL and CRON_SECRET to auto-trigger the Slack drop.\n' +
      'Otherwise, invoke the export cron manually:\n' +
      `  curl -H "Authorization: Bearer $CRON_SECRET" <deployed-url>/api/cron/export-substack`,
  );
  process.exit(0);
}

console.log(`\nTriggering export at ${triggerUrl} ...`);
const res = await fetch(triggerUrl, {
  headers: { Authorization: `Bearer ${cronSecret}` },
});
const body = await res.text();
console.log(`Status ${res.status}: ${body}`);
