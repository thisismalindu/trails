-- Initial private, single-owner Trails schema.
-- Supabase Auth owns identities; public tables reference auth.users(id).

create or replace function public.is_valid_progress_plan(document jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  section jsonb;
  item jsonb;
  section_ids text[] := array[]::text[];
  item_ids text[] := array[]::text[];
  section_id text;
  item_id text;
begin
  if document is null
    or jsonb_typeof(document) is distinct from 'object'
    or jsonb_typeof(document->'version') is distinct from 'number'
    or document->>'version' <> '1'
    or jsonb_typeof(document->'sections') is distinct from 'array' then
    return false;
  end if;

  for section in select value from jsonb_array_elements(document->'sections') loop
    if jsonb_typeof(section) is distinct from 'object'
      or jsonb_typeof(section->'id') is distinct from 'string'
      or coalesce(section->>'id', '') = ''
      or jsonb_typeof(section->'title') is distinct from 'string'
      or btrim(coalesce(section->>'title', '')) = ''
      or jsonb_typeof(section->'items') is distinct from 'array' then
      return false;
    end if;

    section_id := section->>'id';
    if section_id = any(section_ids) then return false; end if;
    section_ids := array_append(section_ids, section_id);

    for item in select value from jsonb_array_elements(section->'items') loop
      if jsonb_typeof(item) is distinct from 'object'
        or jsonb_typeof(item->'id') is distinct from 'string'
        or coalesce(item->>'id', '') = ''
        or jsonb_typeof(item->'label') is distinct from 'string'
        or btrim(coalesce(item->>'label', '')) = ''
        or coalesce(item->>'status', '') not in ('not-started', 'in-progress', 'complete') then
        return false;
      end if;

      item_id := item->>'id';
      if item_id = any(item_ids) then return false; end if;
      item_ids := array_append(item_ids, item_id);
    end loop;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.is_valid_quiz_definition(document jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  question jsonb;
  answer jsonb;
  question_ids text[] := array[]::text[];
  answer_ids text[] := array[]::text[];
  question_id text;
  answer_id text;
  answer_count integer;
  correct_count integer;
begin
  if document is null
    or jsonb_typeof(document) is distinct from 'object'
    or jsonb_typeof(document->'questions') is distinct from 'array' then
    return false;
  end if;

  for question in select value from jsonb_array_elements(document->'questions') loop
    if jsonb_typeof(question) is distinct from 'object'
      or jsonb_typeof(question->'id') is distinct from 'string'
      or coalesce(question->>'id', '') = ''
      or jsonb_typeof(question->'question') is distinct from 'string'
      or btrim(coalesce(question->>'question', '')) = ''
      or jsonb_typeof(question->'hint') is distinct from 'string'
      or btrim(coalesce(question->>'hint', '')) = ''
      or jsonb_typeof(question->'answers') is distinct from 'array'
      or jsonb_array_length(question->'answers') <> 4 then
      return false;
    end if;

    question_id := question->>'id';
    if question_id = any(question_ids) then return false; end if;
    question_ids := array_append(question_ids, question_id);
    answer_count := 0;
    correct_count := 0;

    for answer in select value from jsonb_array_elements(question->'answers') loop
      if jsonb_typeof(answer) is distinct from 'object'
        or jsonb_typeof(answer->'id') is distinct from 'string'
        or coalesce(answer->>'id', '') = ''
        or jsonb_typeof(answer->'text') is distinct from 'string'
        or btrim(coalesce(answer->>'text', '')) = ''
        or jsonb_typeof(answer->'correct') is distinct from 'boolean'
        or jsonb_typeof(answer->'explanation') is distinct from 'string'
        or btrim(coalesce(answer->>'explanation', '')) = '' then
        return false;
      end if;

      answer_id := answer->>'id';
      if answer_id = any(answer_ids) then return false; end if;
      answer_ids := array_append(answer_ids, answer_id);
      answer_count := answer_count + 1;
      if answer->>'correct' = 'true' then correct_count := correct_count + 1; end if;
    end loop;

    if answer_count <> 4 or correct_count <> 1 then return false; end if;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.is_valid_quiz_session(session jsonb, definition jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  question jsonb;
  question_id text;
  answer_id text;
  selection record;
  question_ids text[] := array[]::text[];
  checked_ids text[] := array[]::text[];
  hint_ids text[] := array[]::text[];
begin
  if session is null then return true; end if;
  if jsonb_typeof(session) is distinct from 'object'
    or jsonb_typeof(session->'currentIndex') is distinct from 'number'
    or (session->>'currentIndex')::numeric <> trunc((session->>'currentIndex')::numeric)
    or (session->>'currentIndex')::integer < 0
    or coalesce(session->>'view', '') not in ('taking', 'results', 'review')
    or jsonb_typeof(session->'startedAt') is distinct from 'string'
    or jsonb_typeof(session->'selectedAnswers') is distinct from 'object'
    or jsonb_typeof(session->'checkedQuestionIds') is distinct from 'array'
    or jsonb_typeof(session->'hintQuestionIds') is distinct from 'array' then
    return false;
  end if;

  for question in select value from jsonb_array_elements(definition->'questions') loop
    question_ids := array_append(question_ids, question->>'id');
  end loop;

  for selection in select key, value from jsonb_each(session->'selectedAnswers') loop
    question_id := selection.key;
    answer_id := selection.value #>> '{}';
    if jsonb_typeof(selection.value) is distinct from 'string'
      or not (question_id = any(question_ids))
      or not exists (
        select 1 from jsonb_array_elements(definition->'questions') q
        cross join jsonb_array_elements(q->'answers') a
        where q->>'id' = question_id and a->>'id' = answer_id
      ) then
      return false;
    end if;
  end loop;

  if exists (
    select 1 from jsonb_array_elements(session->'checkedQuestionIds') value
    where jsonb_typeof(value) is distinct from 'string'
  ) or exists (
    select 1 from jsonb_array_elements(session->'hintQuestionIds') value
    where jsonb_typeof(value) is distinct from 'string'
  ) then
    return false;
  end if;

  select coalesce(array_agg(value #>> '{}'), array[]::text[]) into checked_ids
  from jsonb_array_elements(session->'checkedQuestionIds');
  select coalesce(array_agg(value #>> '{}'), array[]::text[]) into hint_ids
  from jsonb_array_elements(session->'hintQuestionIds');
  if (cardinality(question_ids) = 0 and (session->>'currentIndex')::integer <> 0)
    or (cardinality(question_ids) > 0 and (session->>'currentIndex')::integer >= cardinality(question_ids)) then
    return false;
  end if;
  if exists (select 1 from unnest(checked_ids || hint_ids) id where not (id = any(question_ids))) then
    return false;
  end if;

  return true;
exception when others then
  return false;
end;
$$;

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null check (btrim(slug) <> ''),
  title text not null check (btrim(title) <> ''),
  objective text not null check (btrim(objective) <> ''),
  progress_plan jsonb not null default '{"version":1,"sections":[]}'::jsonb
    check (public.is_valid_progress_plan(progress_plan)),
  progress_import_source text not null default 'manual'
    check (progress_import_source in ('manual', 'json', 'sample')),
  progress_imported_at timestamptz,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint roadmaps_owner_slug_unique unique (owner_id, slug),
  constraint roadmaps_id_owner_unique unique (id, owner_id),
  constraint roadmaps_progress_provenance check (
    (progress_import_source = 'json' and progress_imported_at is not null)
    or (progress_import_source <> 'json')
  )
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  owner_id uuid not null,
  type text not null check (type in ('article', 'video', 'note')),
  title text not null check (btrim(title) <> ''),
  url text,
  notes text not null default '',
  tags text[] not null default array[]::text[],
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_roadmap_owner_fk foreign key (roadmap_id, owner_id)
    references public.roadmaps(id, owner_id) on delete cascade,
  constraint resources_url_required check (type = 'note' or (url is not null and btrim(url) <> '')),
  constraint resources_note_url_optional check (type <> 'note' or url is null or btrim(url) <> '')
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  owner_id uuid not null,
  title text not null check (btrim(title) <> ''),
  schema_version smallint not null default 1 check (schema_version = 1),
  definition jsonb not null default '{"questions":[]}'::jsonb
    check (public.is_valid_quiz_definition(definition)),
  definition_revision integer not null default 1 check (definition_revision > 0),
  current_session jsonb,
  import_source text not null default 'manual' check (import_source in ('manual', 'json', 'sample')),
  imported_at timestamptz,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_id_owner_unique unique (id, owner_id),
  constraint quizzes_roadmap_owner_fk foreign key (roadmap_id, owner_id)
    references public.roadmaps(id, owner_id) on delete cascade,
  constraint quizzes_import_provenance check (
    (import_source = 'json' and imported_at is not null)
    or (import_source <> 'json')
  ),
  constraint quizzes_session_valid check (public.is_valid_quiz_session(current_session, definition))
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null,
  owner_id uuid not null,
  definition_revision integer not null check (definition_revision > 0),
  selected_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(selected_answers) = 'object'),
  correct integer not null check (correct >= 0),
  incorrect integer not null check (incorrect >= 0),
  unanswered integer not null check (unanswered >= 0),
  total integer not null check (total >= 0),
  percent smallint not null check (percent between 0 and 100),
  completed_at timestamptz not null default now(),
  constraint quiz_attempts_quiz_owner_fk foreign key (quiz_id, owner_id)
    references public.quizzes(id, owner_id) on delete cascade,
  constraint quiz_attempts_count_sum check (total = correct + incorrect + unanswered),
  constraint quiz_attempts_percent_matches check (
    (total = 0 and percent = 0) or
    (total > 0 and percent = round((correct::numeric / total) * 100)::integer)
  )
);

create or replace function public.validate_quiz_attempt()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quiz_definition jsonb;
  current_definition_revision integer;
  actual_total integer;
  actual_answered integer;
  actual_correct integer;
  selection record;
begin
  select definition, definition_revision
  into quiz_definition, current_definition_revision
  from public.quizzes
  where id = new.quiz_id and owner_id = new.owner_id;

  if not found then
    raise exception 'Quiz is unavailable for this owner.' using errcode = '23503';
  end if;
  if new.definition_revision <> current_definition_revision then
    raise exception 'The quiz definition changed before this attempt was saved.' using errcode = '40001';
  end if;

  actual_total := jsonb_array_length(quiz_definition->'questions');
  actual_answered := 0;
  actual_correct := 0;

  for selection in select key, value from jsonb_each(new.selected_answers) loop
    if jsonb_typeof(selection.value) is distinct from 'string'
      or not exists (
        select 1 from jsonb_array_elements(quiz_definition->'questions') q
        cross join jsonb_array_elements(q->'answers') a
        where q->>'id' = selection.key and a->>'id' = selection.value #>> '{}'
      ) then
      raise exception 'Attempt contains an answer that is not part of this quiz.' using errcode = '23514';
    end if;
    actual_answered := actual_answered + 1;
  end loop;

  select count(*)::integer into actual_correct
  from jsonb_array_elements(quiz_definition->'questions') q
  cross join jsonb_array_elements(q->'answers') a
  where a->>'correct' = 'true'
    and new.selected_answers->>(q->>'id') = a->>'id';

  if new.total <> actual_total
    or new.correct <> actual_correct
    or new.incorrect <> actual_answered - actual_correct
    or new.unanswered <> actual_total - actual_answered then
    raise exception 'Attempt totals do not match the quiz answers.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger attempts_validate before insert on public.quiz_attempts
for each row execute function public.validate_quiz_attempt();

create index roadmaps_owner_archive_updated_idx on public.roadmaps(owner_id, archived_at, updated_at desc);
create index resources_owner_roadmap_position_idx on public.resources(owner_id, roadmap_id, position, id);
create index quizzes_owner_roadmap_updated_idx on public.quizzes(owner_id, roadmap_id, updated_at desc);
create index quiz_attempts_owner_quiz_completed_idx on public.quiz_attempts(owner_id, quiz_id, completed_at desc);

create or replace function public.touch_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prepare_quiz_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  if new.definition is distinct from old.definition or new.title is distinct from old.title then
    new.definition_revision := old.definition_revision + 1;
    new.current_session := null;
  else
    new.definition_revision := old.definition_revision;
  end if;
  return new;
end;
$$;

create or replace function public.touch_roadmap_from_child()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_id uuid;
  parent_owner uuid;
begin
  if tg_op = 'DELETE' then
    parent_id := old.roadmap_id;
    parent_owner := old.owner_id;
  else
    parent_id := new.roadmap_id;
    parent_owner := new.owner_id;
  end if;

  update public.roadmaps
  set updated_at = now(), revision = revision + 1
  where id = parent_id and owner_id = parent_owner;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create or replace function public.touch_quiz_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.quizzes
  set updated_at = now(), revision = revision + 1
  where id = new.quiz_id and owner_id = new.owner_id;
  return new;
end;
$$;

create trigger roadmaps_touch_revision before update on public.roadmaps
for each row execute function public.touch_revision();
create trigger resources_touch_updated_at before update on public.resources
for each row execute function public.touch_updated_at();
create trigger quizzes_prepare_update before update on public.quizzes
for each row execute function public.prepare_quiz_update();
create trigger resources_touch_roadmap after insert or update or delete on public.resources
for each row execute function public.touch_roadmap_from_child();
create trigger quizzes_touch_roadmap after insert or update or delete on public.quizzes
for each row execute function public.touch_roadmap_from_child();
create trigger attempts_touch_parents after insert on public.quiz_attempts
for each row execute function public.touch_quiz_from_attempt();

create or replace function public.finish_quiz_attempt(
  p_quiz_id uuid,
  p_expected_definition_revision integer,
  p_selected_answers jsonb,
  p_final_session jsonb
)
returns public.quiz_attempts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_quiz public.quizzes%rowtype;
  v_attempt public.quiz_attempts%rowtype;
  v_total integer;
  v_answered integer;
  v_correct integer;
begin
  if v_owner_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_selected_answers) is distinct from 'object'
    or jsonb_typeof(p_final_session) is distinct from 'object'
    or p_final_session->>'view' is distinct from 'results'
    or p_final_session->'selectedAnswers' is distinct from p_selected_answers then
    raise exception 'A completed quiz session with matching selected answers is required.' using errcode = '22023';
  end if;

  select * into v_quiz
  from public.quizzes
  where id = p_quiz_id and owner_id = v_owner_id
  for update;
  if not found then
    raise exception 'Quiz not found.' using errcode = 'P0002';
  end if;
  if v_quiz.definition_revision <> p_expected_definition_revision then
    raise exception 'The quiz definition changed before this attempt was saved.' using errcode = '40001';
  end if;
  if not public.is_valid_quiz_session(p_final_session, v_quiz.definition) then
    raise exception 'Quiz session does not match the current definition.' using errcode = '23514';
  end if;

  v_total := jsonb_array_length(v_quiz.definition->'questions');
  select count(*)::integer into v_answered
  from jsonb_each(p_selected_answers) selection
  where jsonb_typeof(selection.value) = 'string'
    and exists (
      select 1
      from jsonb_array_elements(v_quiz.definition->'questions') question
      cross join jsonb_array_elements(question->'answers') answer
      where question->>'id' = selection.key
        and answer->>'id' = selection.value #>> '{}'
    );
  if v_answered <> (select count(*)::integer from jsonb_each(p_selected_answers)) then
    raise exception 'Attempt contains an answer that is not part of this quiz.' using errcode = '23514';
  end if;

  select count(*)::integer into v_correct
  from jsonb_array_elements(v_quiz.definition->'questions') question
  cross join jsonb_array_elements(question->'answers') answer
  where answer->>'correct' = 'true'
    and p_selected_answers->>(question->>'id') = answer->>'id';

  insert into public.quiz_attempts (
    quiz_id, owner_id, definition_revision, selected_answers,
    correct, incorrect, unanswered, total, percent
  ) values (
    v_quiz.id, v_owner_id, v_quiz.definition_revision, p_selected_answers,
    v_correct, v_answered - v_correct, v_total - v_answered, v_total,
    case when v_total = 0 then 0 else round((v_correct::numeric / v_total) * 100)::integer end
  ) returning * into v_attempt;

  update public.quizzes
  set current_session = p_final_session
  where id = v_quiz.id and owner_id = v_owner_id;

  return v_attempt;
end;
$$;

create or replace function public.list_roadmap_summaries()
returns table (
  id uuid,
  slug text,
  title text,
  objective text,
  updated_at timestamptz,
  archived_at timestamptz,
  revision bigint,
  progress_complete integer,
  progress_total integer,
  resource_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    roadmap.id,
    roadmap.slug,
    roadmap.title,
    roadmap.objective,
    roadmap.updated_at,
    roadmap.archived_at,
    roadmap.revision,
    progress.complete,
    progress.total,
    (select count(*) from public.resources resource where resource.roadmap_id = roadmap.id)
  from public.roadmaps roadmap
  cross join lateral (
    select
      count(*) filter (where item->>'status' = 'complete')::integer as complete,
      count(*)::integer as total
    from jsonb_array_elements(roadmap.progress_plan->'sections') section
    cross join lateral jsonb_array_elements(section->'items') item
  ) progress
  where roadmap.owner_id = auth.uid()
  order by roadmap.updated_at desc;
$$;

alter table public.roadmaps enable row level security;
alter table public.resources enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;

revoke all on table public.roadmaps, public.resources, public.quizzes, public.quiz_attempts from anon, authenticated;
grant select, insert, update, delete on table public.roadmaps, public.resources, public.quizzes to authenticated;
grant select, insert on table public.quiz_attempts to authenticated;
revoke all on function public.finish_quiz_attempt(uuid, integer, jsonb, jsonb) from public, anon;
grant execute on function public.finish_quiz_attempt(uuid, integer, jsonb, jsonb) to authenticated;
revoke all on function public.list_roadmap_summaries() from public, anon;
grant execute on function public.list_roadmap_summaries() to authenticated;

create policy roadmaps_select_owned on public.roadmaps for select to authenticated
using (owner_id = (select auth.uid()));
create policy roadmaps_insert_owned on public.roadmaps for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy roadmaps_update_owned on public.roadmaps for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy roadmaps_delete_owned on public.roadmaps for delete to authenticated
using (owner_id = (select auth.uid()));

create policy resources_select_owned on public.resources for select to authenticated
using (owner_id = (select auth.uid()));
create policy resources_insert_owned on public.resources for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy resources_update_owned on public.resources for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy resources_delete_owned on public.resources for delete to authenticated
using (owner_id = (select auth.uid()));

create policy quizzes_select_owned on public.quizzes for select to authenticated
using (owner_id = (select auth.uid()));
create policy quizzes_insert_owned on public.quizzes for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy quizzes_update_owned on public.quizzes for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy quizzes_delete_owned on public.quizzes for delete to authenticated
using (owner_id = (select auth.uid()));

create policy attempts_select_owned on public.quiz_attempts for select to authenticated
using (owner_id = (select auth.uid()));
create policy attempts_insert_owned on public.quiz_attempts for insert to authenticated
with check (owner_id = (select auth.uid()));
