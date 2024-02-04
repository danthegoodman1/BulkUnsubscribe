-- decided not to use sql-migrate because remote sqlite is annoying

create table if not exists users (
  id text not null,
  email text unique not null,

  scopes text[],
  refresh_token text,
  subscription text,

  created_ms int8 not null,

  primary key (id)
)
;

-- storing anything we'd proxy to segment
create table if not exists analytics_events (
  id text not null,
  payload json,

  created_ms int8 not null,

  primary key (id)
)
;

-- for storing all stripe events we get
create table if not exists stripe_webhooks (
  id text not null,
  event text not null,
  payload json,

  created_ms int8 not null,

  primary key (id)
)
;

create table if not exists workflows (
  id text not null,
  name text not null, -- human friendly name
  metadata text,
  status text not null, -- pending, completed, failed
  created_ms int8 not null,
  updated_ms int8 not null,
  primary key(id)
)
;

create table if not exists workflow_tasks (
  workflow text not null,
  task_name text not null,
  seq int8 not null,
  status text not null, -- pending, completed, failed
  data text,
  return text,
  error text,
  created_ms int8 not null,
  updated_ms int8 not null,
  primary key (workflow, seq)
)
;

create table if not exists unsubed_messages (
  user text not null,
  message_id text not null,
  created_ms int8 not null,

  primary key (user, message_id)
)
;
