-- Idempotency log: one row per synced Simplero contact
create table if not exists sync_log (
  id           uuid primary key default gen_random_uuid(),
  contact_id   bigint not null unique,
  email        text not null,
  synced_at    timestamptz not null default now(),
  source       text not null check (source in ('webhook', 'cron', 'backfill'))
);

create index if not exists sync_log_synced_at_idx on sync_log (synced_at);

-- Key/value store for cron state
create table if not exists sync_config (
  key   text primary key,
  value text not null
);

-- Seed the last_synced_at cursor to a safe early date
insert into sync_config (key, value)
values ('last_synced_at', '2020-01-01T00:00:00Z')
on conflict (key) do nothing;
