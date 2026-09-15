begin;

select plan(17);

select has_table('public', 'record_comments', '댓글 테이블이 존재한다');
select has_column('public', 'notifications', 'event_type', '알림 종류 컬럼이 존재한다');
select has_column('public', 'notifications', 'comment_id', '알림 댓글 참조 컬럼이 존재한다');

insert into auth.users (id, email)
values
  ('00000000-0000-4000-8000-000000000001', 'comment-owner-a@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'comment-owner-b@example.com');

insert into public.account_members (id, owner_id, name)
values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '작성자'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', '수신자'),
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000002', '다른 계정');

insert into public.records (
  id,
  owner_id,
  author_member_id,
  recorded_at,
  activity,
  memo,
  region_code,
  region_name,
  region_label,
  region_latitude,
  region_longitude,
  weather
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000011',
    '2026-09-14',
    '함께 저녁 먹기',
    '',
    '1111010100',
    '서울특별시 종로구 청운동',
    '서울 종로구',
    37.58,
    126.97,
    'sunny'
  ),
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000021',
    '2026-09-14',
    '다른 계정 기록',
    '',
    '1111010100',
    '서울특별시 종로구 청운동',
    '서울 종로구',
    37.58,
    126.97,
    'sunny'
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select results_eq(
  $$
    select created
    from public.create_record_comment(
      '00000000-0000-4000-8000-000000001001',
      '00000000-0000-4000-8000-000000000101',
      ' 첫 댓글 ',
      '00000000-0000-4000-8000-000000000011'
    )
  $$,
  $$ values (true) $$,
  '최초 댓글을 작성한다'
);

select results_eq(
  $$ select count(*) from public.record_comments $$,
  array[1::bigint],
  '자기 계정 댓글만 조회한다'
);

select results_eq(
  $$
    select count(*)
    from public.notifications
    where event_type = 'comment_created'
      and recipient_member_id = '00000000-0000-4000-8000-000000000012'
  $$,
  array[1::bigint],
  '작성자를 제외한 활성 멤버에게 댓글 알림을 만든다'
);

select results_eq(
  $$
    select count(*)
    from public.notifications
    where event_type = 'comment_created'
      and recipient_member_id = '00000000-0000-4000-8000-000000000011'
  $$,
  array[0::bigint],
  '작성자 자신에게는 알리지 않는다'
);

select throws_ok(
  $$
    update public.record_comments
    set body = '수정한 댓글'
    where id = '00000000-0000-4000-8000-000000001001'
  $$,
  '42501',
  null,
  '댓글을 수정할 수 없다'
);

select lives_ok(
  $$ delete from public.record_comments where id = '00000000-0000-4000-8000-000000001001' $$,
  '댓글을 삭제할 수 있다'
);

select results_eq(
  $$
    select count(*)
    from public.notifications
    where event_type = 'comment_created'
      and comment_id is null
  $$,
  array[1::bigint],
  '댓글 삭제는 새 알림 없이 기존 알림 이력을 보존한다'
);

select results_eq(
  $$
    select created
    from public.create_record_comment(
      '00000000-0000-4000-8000-000000001002',
      '00000000-0000-4000-8000-000000000101',
      '두 번째 댓글',
      '00000000-0000-4000-8000-000000000011'
    )
  $$,
  $$ values (true) $$,
  '두 번째 댓글을 작성한다'
);

select results_eq(
  $$
    select created
    from public.create_record_comment(
      '00000000-0000-4000-8000-000000001002',
      '00000000-0000-4000-8000-000000000101',
      '두 번째 댓글',
      '00000000-0000-4000-8000-000000000011'
    )
  $$,
  $$ values (false) $$,
  '같은 요청을 재시도하면 기존 댓글을 반환한다'
);

select results_eq(
  $$
    select count(*)
    from public.notifications
    where event_type = 'comment_created'
      and comment_id = '00000000-0000-4000-8000-000000001002'
  $$,
  array[1::bigint],
  '같은 댓글의 인앱 알림을 중복 생성하지 않는다'
);

select lives_ok(
  $$
    select private.create_record_notifications(
      '00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000011'
    )
  $$,
  '댓글 알림과 같은 기록의 기존 기록 알림을 만들 수 있다'
);

select results_eq(
  $$
    select count(*)
    from public.notifications
    where event_type = 'record_created'
      and record_id = '00000000-0000-4000-8000-000000000101'
      and recipient_member_id = '00000000-0000-4000-8000-000000000012'
  $$,
  array[1::bigint],
  '기존 기록 알림의 중복 방지 동작을 유지한다'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';

select results_eq(
  $$ select count(*) from public.record_comments $$,
  array[0::bigint],
  '다른 계정의 댓글은 조회할 수 없다'
);

select is_empty(
  $$
    select *
    from public.create_record_comment(
      '00000000-0000-4000-8000-000000001003',
      '00000000-0000-4000-8000-000000000101',
      '다른 계정의 댓글',
      '00000000-0000-4000-8000-000000000021'
    )
  $$,
  '다른 계정의 기록에는 댓글을 작성할 수 없다'
);

select * from finish();
rollback;
