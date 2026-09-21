begin;

select plan(39);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000aa01', 'authenticated', 'authenticated', 'trails-owner-1@example.test', '', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000aa02', 'authenticated', 'authenticated', 'trails-owner-2@example.test', '', now(), now(), now());

insert into public.roadmaps (id, owner_id, slug, title, objective)
values
  ('00000000-0000-4000-8000-00000000bb01', '00000000-0000-4000-8000-00000000aa01', 'owner-one', 'Owner one', 'Private roadmap for owner one.'),
  ('00000000-0000-4000-8000-00000000bb02', '00000000-0000-4000-8000-00000000aa02', 'owner-two', 'Owner two', 'Private roadmap for owner two.');

select ok(
  public.is_valid_progress_plan('{"version":1,"sections":[{"id":"s1","title":"Basics","items":[{"id":"i1","label":"Read","status":"not-started"}]}]}'::jsonb),
  'accepts a valid version 1 progress plan'
);
select ok(
  not public.is_valid_progress_plan('{"version":1,"sections":[{"id":"s1","title":"Basics","items":[{"id":"i1","label":"Read","status":"complete"}]},{"id":"s2","title":"More","items":[{"id":"i1","label":"Repeat ID","status":"in-progress"}]}]}'::jsonb),
  'rejects duplicate progress item IDs across sections'
);
select ok(
  not public.is_valid_progress_plan('{"version":1,"sections":[{"id":"s1","title":"Basics","items":[{"id":"i1","label":"Read","status":"blocked"}]}]}'::jsonb),
  'rejects unknown progress statuses'
);
select ok(
  public.is_valid_quiz_definition('{"questions":[{"id":"q1","question":"Question?","hint":"Think carefully","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a2","text":"Two","correct":false,"explanation":"No."},{"id":"a3","text":"Three","correct":false,"explanation":"No."},{"id":"a4","text":"Four","correct":false,"explanation":"No."}]}]}'::jsonb),
  'accepts four answers with exactly one correct answer'
);
select ok(
  not public.is_valid_quiz_definition('{"questions":[{"id":"q1","question":"Question?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."}]}]}'::jsonb),
  'rejects questions that do not have exactly four answers'
);
select ok(
  not public.is_valid_quiz_definition('{"questions":[{"id":"q1","question":"Question?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a2","text":"Two","correct":true,"explanation":"Also correct."},{"id":"a3","text":"Three","correct":false,"explanation":"No."},{"id":"a4","text":"Four","correct":false,"explanation":"No."}]}]}'::jsonb),
  'rejects questions with multiple correct answers'
);
select ok(
  not public.is_valid_quiz_definition('{"questions":[{"id":"q1","question":"First?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a2","text":"Two","correct":false,"explanation":"No."},{"id":"a3","text":"Three","correct":false,"explanation":"No."},{"id":"a4","text":"Four","correct":false,"explanation":"No."}]},{"id":"q2","question":"Second?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a5","text":"Two","correct":false,"explanation":"No."},{"id":"a6","text":"Three","correct":false,"explanation":"No."},{"id":"a7","text":"Four","correct":false,"explanation":"No."}]}]}'::jsonb),
  'rejects answer IDs reused across questions'
);
select ok(
  public.is_valid_quiz_session('{"currentIndex":0,"selectedAnswers":{"q1":"a1"},"checkedQuestionIds":[],"hintQuestionIds":["q1"],"view":"taking","startedAt":"2026-09-21T00:00:00Z"}'::jsonb, '{"questions":[{"id":"q1","question":"Question?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a2","text":"Two","correct":false,"explanation":"No."},{"id":"a3","text":"Three","correct":false,"explanation":"No."},{"id":"a4","text":"Four","correct":false,"explanation":"No."}]}]}'::jsonb),
  'accepts a session whose selected answer belongs to its definition'
);
select ok(
  not public.is_valid_quiz_session('{"currentIndex":0,"selectedAnswers":{"q1":"missing"},"checkedQuestionIds":[],"hintQuestionIds":[],"view":"taking","startedAt":"2026-09-21T00:00:00Z"}'::jsonb, '{"questions":[{"id":"q1","question":"Question?","hint":"Hint","answers":[{"id":"a1","text":"One","correct":true,"explanation":"Correct."},{"id":"a2","text":"Two","correct":false,"explanation":"No."},{"id":"a3","text":"Three","correct":false,"explanation":"No."},{"id":"a4","text":"Four","correct":false,"explanation":"No."}]}]}'::jsonb),
  'rejects session selections absent from the quiz definition'
);

select ok((select relrowsecurity from pg_class where oid = 'public.roadmaps'::regclass), 'roadmaps has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.resources'::regclass), 'resources has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.quizzes'::regclass), 'quizzes has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.quiz_attempts'::regclass), 'quiz attempts has RLS enabled');
select ok((select count(*) = 4 from pg_policy where polrelid = 'public.roadmaps'::regclass), 'roadmaps has separate operation policies');
select ok((select count(*) = 4 from pg_policy where polrelid = 'public.resources'::regclass), 'resources has separate operation policies');
select ok((select count(*) = 4 from pg_policy where polrelid = 'public.quizzes'::regclass), 'quizzes has separate operation policies');
select ok((select count(*) = 2 from pg_policy where polrelid = 'public.quiz_attempts'::regclass), 'attempts expose read and insert policies only');
select ok(not has_table_privilege('authenticated', 'public.quiz_attempts', 'UPDATE'), 'quiz attempts cannot be updated directly');
select ok(not has_table_privilege('authenticated', 'public.quiz_attempts', 'DELETE'), 'quiz attempts cannot be deleted directly');
select ok(has_function_privilege('authenticated', 'public.finish_quiz_attempt(uuid,integer,jsonb,jsonb)', 'EXECUTE'), 'authenticated users can finish their quiz attempts');
select ok(not has_function_privilege('anon', 'public.finish_quiz_attempt(uuid,integer,jsonb,jsonb)', 'EXECUTE'), 'anonymous users cannot finish quiz attempts');
select ok(has_function_privilege('authenticated', 'public.list_roadmap_summaries()', 'EXECUTE'), 'authenticated users can list roadmap summaries');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa01', true);
select is((select count(*) from public.roadmaps where id = '00000000-0000-4000-8000-00000000bb01'), 1::bigint, 'owner can read their own roadmap');
select is((select count(*) from public.roadmaps where id = '00000000-0000-4000-8000-00000000bb02'), 0::bigint, 'owner cannot read another user roadmap');
select is((select count(*) from public.list_roadmap_summaries()), 1::bigint, 'roadmap summaries expose only the authenticated owner rows');
insert into public.roadmaps (id, owner_id, slug, title, objective)
values ('00000000-0000-4000-8000-00000000bb03', '00000000-0000-4000-8000-00000000aa01', 'owner-one-second', 'Owner one second', 'Another private roadmap for owner one.');
select is((select count(*) from public.roadmaps where owner_id = '00000000-0000-4000-8000-00000000aa01'), 2::bigint, 'owner can create a roadmap for themselves');
insert into public.quizzes (id, roadmap_id, owner_id, title)
values ('00000000-0000-4000-8000-00000000cc01', '00000000-0000-4000-8000-00000000bb01', '00000000-0000-4000-8000-00000000aa01', 'Initial quiz');
select is((select revision from public.quizzes where id = '00000000-0000-4000-8000-00000000cc01'), 1::bigint, 'quiz starts at revision one');
update public.quizzes set title = 'Renamed quiz' where id = '00000000-0000-4000-8000-00000000cc01';
select is((select revision from public.quizzes where id = '00000000-0000-4000-8000-00000000cc01'), 2::bigint, 'quiz update increments its optimistic revision');
select is((select definition_revision from public.quizzes where id = '00000000-0000-4000-8000-00000000cc01'), 2, 'quiz definition revision advances on a definition title edit');
select is(
  (select correct from public.finish_quiz_attempt(
    '00000000-0000-4000-8000-00000000cc01', 2,
    '{"q1":"a1"}'::jsonb,
    '{"currentIndex":0,"selectedAnswers":{"q1":"a1"},"checkedQuestionIds":["q1"],"hintQuestionIds":[],"view":"results","startedAt":"2026-09-21T00:00:00Z"}'::jsonb
  )),
  1,
  'finishing a quiz records an attempt using the stored definition'
);
select is((select count(*) from public.quiz_attempts where quiz_id = '00000000-0000-4000-8000-00000000cc01'), 1::bigint, 'finishing a quiz records one immutable attempt');
select throws_ok(
  $$select public.finish_quiz_attempt('00000000-0000-4000-8000-00000000cc01', 1, '{"q1":"a1"}'::jsonb, '{"currentIndex":0,"selectedAnswers":{"q1":"a1"},"checkedQuestionIds":["q1"],"hintQuestionIds":[],"view":"results","startedAt":"2026-09-21T00:00:00Z"}'::jsonb)$$,
  '40001',
  'The quiz definition changed before this attempt was saved.',
  'finishing a quiz rejects stale quiz definitions'
);
select is((select revision from public.roadmaps where id = '00000000-0000-4000-8000-00000000bb01'), 5::bigint, 'quiz changes advance the roadmap revision');
select throws_ok(
  $$insert into public.roadmaps (owner_id, slug, title, objective) values ('00000000-0000-4000-8000-00000000aa02', 'forged-owner', 'Forged', 'Should be rejected.')$$,
  '42501',
  'new row violates row-level security policy for table "roadmaps"',
  'owner cannot create a roadmap for another user'
);
select throws_ok(
  $$insert into public.resources (roadmap_id, owner_id, type, title) values ('00000000-0000-4000-8000-00000000bb02', '00000000-0000-4000-8000-00000000aa01', 'note', 'Wrong parent')$$,
  '23503',
  'insert or update on table "resources" violates foreign key constraint "resources_roadmap_owner_fk"',
  'composite foreign key rejects a child attached to another owner roadmap'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa02', true);
select is((select count(*) from public.roadmaps where id = '00000000-0000-4000-8000-00000000bb01'), 0::bigint, 'second owner cannot read first owner roadmap');
select is((select count(*) from public.roadmaps where id = '00000000-0000-4000-8000-00000000bb02'), 1::bigint, 'second owner can read their own roadmap');

reset role;
select ok(not has_table_privilege('anon', 'public.roadmaps', 'SELECT'), 'anonymous role has no roadmap table access');
delete from auth.users where id = '00000000-0000-4000-8000-00000000aa02';
select is((select count(*) from public.roadmaps where owner_id = '00000000-0000-4000-8000-00000000aa02'), 0::bigint, 'deleting an Auth user cascades through their roadmaps');
select * from finish();
rollback;
