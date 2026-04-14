-- Queue of Simplero welcome-series completers awaiting export to Substack via Slack CSV drop.
-- Rows are inserted by the webhook (real-time) and by the cron's Simplero sweep (fallback).
-- The monthly cron reads all unexported rows, uploads a CSV to Slack, and stamps exported_at + export_batch_id.
create table if not exists export_queue (
  contact_id        bigint primary key,
  email             text not null,
  name              text,
  source            text not null check (source in ('webhook', 'cron', 'backfill')),
  queued_at         timestamptz not null default now(),
  exported_at       timestamptz,
  export_batch_id   uuid
);

create index if not exists export_queue_unexported_idx
  on export_queue (queued_at)
  where exported_at is null;
