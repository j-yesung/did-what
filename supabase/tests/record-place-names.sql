BEGIN;
DO $$
DECLARE
  owner_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  place_id uuid;
  record_id uuid;
  regions jsonb := '[{"code":"1144000000","name":"서울 마포구","label":"마포구","latitude":37.5,"longitude":127,"selected_directly":true}]'::jsonb;
BEGIN
  INSERT INTO auth.users (id) VALUES (owner_id);
  INSERT INTO public.account_members (id, owner_id, name) VALUES (member_id, owner_id, '장소 검색 테스트');
  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  SET LOCAL ROLE authenticated;

  record_id := public.create_owned_record_with_places(
    current_date, NULL, regions, '장소 검색 테스트', '', '[]'::jsonb, 'sunny', member_id, ARRAY['daily']
  );
  INSERT INTO public.places (owner_id, name, latitude, longitude, provider, provider_place_id, region_code)
  VALUES (owner_id, '연남동 카페', 37.5, 127, 'test', 'place-names-test', '1144000000')
  RETURNING id INTO place_id;
  INSERT INTO public.record_places (record_id, place_id) VALUES (record_id, place_id);

  IF NOT EXISTS (SELECT 1 FROM public.records r WHERE r.id = record_id AND public.place_names(r) ILIKE '%카페%') THEN
    RAISE EXCEPTION '장소 이름 검색 실패';
  END IF;
  IF EXISTS (SELECT 1 FROM public.records r WHERE r.id = record_id AND public.place_names(r) ILIKE '%없는장소%') THEN
    RAISE EXCEPTION '없는 장소가 검색됨';
  END IF;
END;
$$;
ROLLBACK;
