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
