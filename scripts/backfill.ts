/**
 * One-time backfill: subscribes all existing Simplero contacts tagged
 * "Welcome Series - Substack Synced" to Substack, skipping any already
 * in the sync_log (idempotent — safe to re-run).
 *
 * Prerequisites:
 *  1. SIMPLERO_TAG_ID set in .env (the ID of "Welcome Series - Substack Synced")
 *  2. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env
 *
 * Run:
 *   npm run backfill
 *
 * Approximate contact count as of Apr 2026: ~20 contacts (trivial run time).
 */
import 'dotenv/config';
import { SimpleroClient } from '../lib/SimpleroClient';
import { subscribeToSubstack } from '../lib/SubstackSubscriber';
import { isAlreadySynced, insertSyncLog } from '../lib/db/syncLog';

const apiKey = process.env.SIMPLERO_API_KEY;
const tagId = Number(process.env.SIMPLERO_TAG_ID);

if (!apiKey || !tagId) {
  console.error('Required: SIMPLERO_API_KEY, SIMPLERO_TAG_ID');
  process.exit(1);
}

const client = new SimpleroClient(apiKey);

let synced = 0;
let skipped = 0;
let failed = 0;

// Pre-flight: show total count so the user can abort if something looks wrong
const { contacts: firstPage } = await client.getContactsByTagId(tagId);
console.log(`Starting backfill — found at least ${firstPage.length} contacts with tag_id=${tagId}`);
console.log('(Will paginate through all pages automatically)\n');

for await (const contact of client.paginateContactsByTag(tagId)) {
  if (await isAlreadySynced(contact.id)) {
    skipped++;
    continue;
  }

  const result = await subscribeToSubstack(contact.email);

  if (result.success) {
    await insertSyncLog(contact.id, contact.email, 'backfill');
    synced++;
    console.log(`  ✓ ${contact.email}`);
  } else {
    failed++;
    console.error(`  ✗ ${contact.email} (HTTP ${result.status})`);
  }

  // Gentle rate limiting — avoid hammering Substack
  await new Promise((r) => setTimeout(r, 300));
}

console.log(`\nBackfill complete: ${synced} synced, ${skipped} skipped, ${failed} failed`);
