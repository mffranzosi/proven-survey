-- Run once in the Neon SQL editor.
-- The two tables are deliberately unlinked: no shared id, and contacts stores the date only.

create table if not exists responses (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  survey_version text not null,
  track          text not null check (track in ('b2b', 'b2c')),
  role           text not null,
  answers        smallint[] not null,
  message        text not null,
  is_test        boolean not null default false
);

create table if not exists contacts (
  id                 uuid primary key default gen_random_uuid(),
  created_on         date not null default current_date,
  name               text not null,
  email              text not null unique,
  company            text,
  newsletter_consent boolean not null default true,
  consent_version    text not null
);
