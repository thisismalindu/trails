# Trails database contract (design only)

This document freezes the first persistence contract. It is not a migration and the application makes no backend calls yet.

## Product rules

- Authenticated, cloud-persisted, single-owner roadmaps. Sharing, teams and public roadmaps are out of scope.
- A roadmap can be created, renamed, archived, restored and permanently deleted. Deleting a roadmap cascades to resources.
- Progress uses `not-started`, `in-progress`, or `complete`. A roadmap has one current progress document and one current quiz definition.
- Quiz selections and checked state form one current session; attempt history is out of scope.
- Schema-v1 JSON imports replace the current document after preview. Merge and import history are out of scope.
- Article and video resources require a URL; note URLs are nullable.

## Tables

`roadmaps`: `id uuid primary key default gen_random_uuid()`, `owner_id uuid not null references auth.users(id) on delete cascade`, `slug text not null`, `title text not null`, `objective text not null`, `progress_plan jsonb not null`, `quiz_definition jsonb not null`, `quiz_session jsonb not null`, `progress_imported_at timestamptz`, `quiz_imported_at timestamptz`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`, `archived_at timestamptz`, `version integer not null default 1 check (version > 0)`. Unique `(owner_id, slug)`.

`resources`: `id uuid primary key default gen_random_uuid()`, `roadmap_id uuid not null references roadmaps(id) on delete cascade`, `type text not null check (type in ('article','video','note'))`, `title text not null`, `url text`, `notes text not null default ''`, `tags text[] not null default '{}'`, `position integer not null check (position >= 0)`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`. URL constraint: `type = 'note' or url is not null`. Unique `(roadmap_id, position)`.

Indexes: `roadmaps(owner_id, archived_at, updated_at desc)` and `resources(roadmap_id, position)`.

## Ownership and RLS

Enable RLS on both tables. `roadmaps` select/insert/update/delete policies require `auth.uid() = owner_id`. Resource policies require an `exists` lookup of the parent roadmap with matching `owner_id`. Use `auth.users` directly; do not create `profiles` until profile data exists.

## REST and concurrency

Supabase REST is the future adapter. Reads request a roadmap and ordered resources. Updates include both `id` and the last observed `version`; the update increments `version`. A zero-row response is a stale-write conflict, not success. The client keeps an optimistic snapshot and restores it on network, authorization, validation, or stale-write failure.

## Normalization trigger

Keep progress and quiz as JSONB until attempt history, analytics, collaboration, or partial concurrent edits require relational rows. At that point, add purpose-built tables rather than mirroring the frontend reducer.
