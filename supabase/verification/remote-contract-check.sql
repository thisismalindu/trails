-- Transactional smoke checks for the hosted development project.
-- Use `supabase db query --linked --file supabase/verification/remote-contract-check.sql`.
begin;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000ee01', 'authenticated', 'authenticated', 'trails-smoke-owner@example.test', '', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000ee02', 'authenticated', 'authenticated', 'trails-smoke-other@example.test', '', now(), now(), now());

insert into public.roadmaps (id, owner_id, slug, title, objective)
values
  ('00000000-0000-4000-8000-00000000ff01', '00000000-0000-4000-8000-00000000ee01', 'trails-smoke-owner', 'Smoke roadmap', 'Validate the hosted Trails database contract.'),
  ('00000000-0000-4000-8000-00000000ff02', '00000000-0000-4000-8000-00000000ee02', 'trails-smoke-other', 'Private roadmap', 'Must remain hidden from the first owner.');

insert into public.quizzes (id, roadmap_id, owner_id, title, definition)
values (
  '00000000-0000-4000-8000-00000000dd01',
  '00000000-0000-4000-8000-00000000ff01',
  '00000000-0000-4000-8000-00000000ee01',
  'Smoke quiz',
  '{"questions":[{"id":"q1","question":"Which answer is correct?","hint":"Choose the marked concept.","answers":[{"id":"a1","text":"Wrong","correct":false,"explanation":"This is not correct."},{"id":"a2","text":"Correct","correct":true,"explanation":"This is correct."},{"id":"a3","text":"Wrong","correct":false,"explanation":"This is not correct."},{"id":"a4","text":"Wrong","correct":false,"explanation":"This is not correct."}]}]}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000ee01', true);

do $$
declare
  v_attempt public.quiz_attempts%rowtype;
begin
  if (select count(*) from public.roadmaps where id = '00000000-0000-4000-8000-00000000ff02') <> 0 then
    raise exception 'RLS exposed a roadmap belonging to another owner.';
  end if;
  if (select count(*) from public.list_roadmap_summaries() where id = '00000000-0000-4000-8000-00000000ff01') <> 1 then
    raise exception 'Roadmap summary RPC did not return the authenticated owner roadmap.';
  end if;
  if not public.is_valid_progress_plan('{"version":1,"sections":[{"id":"s1","title":"Basics","items":[{"id":"i1","label":"Read","status":"complete"}]}]}'::jsonb) then
    raise exception 'Valid progress JSON was rejected.';
  end if;

  select * into v_attempt
  from public.finish_quiz_attempt(
    '00000000-0000-4000-8000-00000000dd01',
    1,
    '{"q1":"a2"}'::jsonb,
    '{"currentIndex":0,"selectedAnswers":{"q1":"a2"},"checkedQuestionIds":["q1"],"hintQuestionIds":[],"view":"results","startedAt":"2026-09-21T00:00:00Z"}'::jsonb
  );
  if v_attempt.correct <> 1 or v_attempt.incorrect <> 0 or v_attempt.unanswered <> 0 or v_attempt.percent <> 100 then
    raise exception 'Quiz attempt score did not match the stored quiz definition.';
  end if;
  if (select count(*) from public.quiz_attempts where quiz_id = '00000000-0000-4000-8000-00000000dd01') <> 1 then
    raise exception 'Quiz completion did not create exactly one attempt.';
  end if;
  if (select current_session->>'view' from public.quizzes where id = '00000000-0000-4000-8000-00000000dd01') <> 'results' then
    raise exception 'Quiz completion did not save the finished session.';
  end if;

  begin
    perform public.finish_quiz_attempt(
      '00000000-0000-4000-8000-00000000dd01',
      0,
      '{"q1":"a2"}'::jsonb,
      '{"currentIndex":0,"selectedAnswers":{"q1":"a2"},"checkedQuestionIds":["q1"],"hintQuestionIds":[],"view":"results","startedAt":"2026-09-21T00:00:00Z"}'::jsonb
    );
    raise exception 'Stale quiz revision was accepted.';
  exception when serialization_failure then
    null;
  end;
end;
$$;

reset role;
rollback;
