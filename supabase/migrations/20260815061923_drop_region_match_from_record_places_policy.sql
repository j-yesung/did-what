-- record_places 정책에 남아 있던 지역 일치 조건을 없앤다.
-- 함수가 SECURITY DEFINER가 아니라 내부 INSERT에도 이 정책이 걸려, 지역이 다른 장소를 담으면 저장이 실패했다.
-- 기록과 장소가 모두 본인 것이어야 한다는 소유권 검사는 using과 with check 양쪽에 그대로 둔다.

alter policy "Users manage links between their own records and places"
on public.record_places
using (
  exists (
    select 1 from public.records
    where records.id = record_places.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.places
    where places.id = record_places.place_id
      and places.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.records
    where records.id = record_places.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.places
    where places.id = record_places.place_id
      and places.owner_id = (select auth.uid())
  )
);;
