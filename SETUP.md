# Setup Guide — Simplero → Substack Sync

## Account Details (from API)
- **Simplero account:** The Career Studio (`www.annebenveniste.com`)
- **Account owner:** Anne Benveniste (`anne.benven`)
- **Substack:** [annebenven.substack.com](https://annebenven.substack.com) — "Character"

## Relevant Automations Found
| ID     | Name                                        | Notes                     |
|--------|---------------------------------------------|---------------------------|
| 229534 | Newsletter Welcome Series Oct '24 - 8 emails | **Active series — use this** |
| 143621 | Newsletter Welcome Series                    | Older version              |
| 292634 | Career Studio Nurture Series                 | Related nurture sequence   |

## Relevant Tags Found
| ID     | Name                          |
|--------|-------------------------------|
| 154232 | Newsletter Welcome Series      |
| 178730 | Automation - Nurture           |

No completion tag exists yet. One must be created (see Step 2 below).

---

## One-Time Manual Steps in Simplero Admin

### Step 1 — Create the completion tag

1. Go to **Contacts → Tags** (or Contacts → Labels depending on your Simplero version)
2. Create a new tag named: **`Welcome Series - Substack Synced`**
3. Note the numeric ID Simplero assigns — you'll see it in the URL when you click the tag
4. Add it to `.env` as `SIMPLERO_TAG_ID=<id>`

### Step 2 — Create the outbound webhook

1. Go to **Integrations → Webhooks → Create new webhook**
2. Set the **Target URL** to:
   ```
   https://<your-vercel-url>/api/webhooks/simplero?secret=<SIMPLERO_WEBHOOK_SECRET>
   ```
   *(replace with your actual Vercel deployment URL and the secret from `.env`)*
3. Save it and note the webhook name/ID for Step 3

### Step 3 — Edit the welcome series automation

1. Go to **Automations → "Newsletter Welcome Series Oct '24 - 8 emails"** (ID: 229534)
2. Navigate to the final email step (step 8)
3. Add two new steps **after** the last email:
   - **Add tag:** `Welcome Series - Substack Synced`
   - **Send webhook:** select the webhook created in Step 2
4. Save the automation

> The "Add tag" step enables the monthly cron to find all completers.  
> The "Send webhook" step triggers the real-time subscription.

---

## Capturing the Webhook Payload Shape (before deploying)

Before deploying to Vercel, confirm the real webhook payload:

1. Go to [webhook.site](https://webhook.site) and copy your unique URL
2. Create a **test webhook** in Simplero pointing to that URL
3. Temporarily add that webhook to the automation in place of the production one
4. In the Simplero automation, manually advance a **test contact** to the final step
   *(Automations → Flows → find the contact → click "Continue now")*
5. Copy the raw JSON body from webhook.site
6. Update `schemas/simpleroWebhook.ts` to match the real field names

---

## Substack Challenges

Substack's public subscribe endpoint is protected by Cloudflare and rejects
server-side requests. 
---

## Deployment Steps

1. **Generate secrets:**
   ```powershell
   # Run these and paste into .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # SIMPLERO_WEBHOOK_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # CRON_SECRET
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run `supabase/migrations/001_init.sql` in the SQL editor
   - Copy the Project URL and `service_role` key into `.env`

3. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   ```
   Set all `.env` vars in the Vercel dashboard under Project → Settings → Environment Variables.

4. **Register the production webhook in Simplero:**
   ```bash
   VERCEL_URL=https://your-app.vercel.app npm run setup-webhook
   ```
   Then follow Step 3 above to attach it to the automation.

5. **Run the backfill** to sync the ~20 existing completers:
   ```bash
   npm run backfill
   ```

---

## Ongoing Monitoring

- **Webhook path:** fires in real-time as each contact completes the series
- **Cron path:** runs at 09:00 on the 1st of every month as a safety net
- **Audit log:** all synced contacts logged in Supabase `sync_log` table
- To view the log: Supabase dashboard → Table Editor → `sync_log`
