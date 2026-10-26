BEGIN;
DO $$
DECLARE
  owner_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  record_id uuid;
  regions jsonb := '[{"code":"1144000000","name":"서울 마포구","label":"마포구","latitude":37.5,"longitude":127,"selected_directly":true}]'::jsonb;
BEGIN
  INSERT INTO auth.users (id) VALUES (owner_id);
  INSERT INTO public.account_members (id, owner_id, name) VALUES (member_id, owner_id, '카테고리 테스트');
  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  SET LOCAL ROLE authenticated;

  record_id := public.create_owned_record_with_places(
    current_date, NULL, regions, '복수 카테고리 테스트', '', '[]'::jsonb, 'sunny', member_id, ARRAY['date', 'travel']
  );
  IF record_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.records WHERE id = record_id AND category = ARRAY['date', 'travel']
  ) THEN
    RAISE EXCEPTION '복수 카테고리 생성 실패';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.records WHERE id = record_id AND category @> ARRAY['travel']) THEN
    RAISE EXCEPTION '카테고리 포함 필터 실패';
  END IF;

  IF NOT public.update_owned_record_with_places(record_id, current_date, NULL, regions, '수정 테스트', '', '[]'::jsonb, 'sunny', ARRAY['anniversary', 'date'])
  THEN
    RAISE EXCEPTION '복수 카테고리 수정 호출 실패';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.records WHERE id = record_id AND category = ARRAY['anniversary', 'date']) THEN
    RAISE EXCEPTION '복수 카테고리 수정 실패';
  END IF;
  IF NOT public.update_owned_record_with_places(record_id, current_date, NULL, regions, '미분류 테스트', '', '[]'::jsonb, 'sunny', ARRAY[]::text[])
  THEN
    RAISE EXCEPTION '미분류 수정 호출 실패';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.records WHERE id = record_id AND category = ARRAY[]::text[]) THEN
    RAISE EXCEPTION '미분류 저장 실패';
  END IF;

  BEGIN
    UPDATE public.records SET category = ARRAY['invalid'] WHERE id = record_id;
    RAISE EXCEPTION '알 수 없는 카테고리를 허용함';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.records SET category = ARRAY['date', NULL] WHERE id = record_id;
    RAISE EXCEPTION 'NULL 카테고리를 허용함';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  IF EXISTS (SELECT 1 FROM public.records WHERE id = record_id)
    OR public.update_owned_record_with_places(record_id, current_date, NULL, regions, '권한 테스트', '', '[]'::jsonb, 'sunny', ARRAY['date'])
  THEN
    RAISE EXCEPTION '다른 소유자의 기록에 접근함';
  END IF;
  RESET ROLE;
END;
$$;
ROLLBACK;
