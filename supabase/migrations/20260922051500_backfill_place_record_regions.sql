/**
 * 20260922043000의 백필은 기록의 대표 지역만 옮겼다.
 * 그래서 기록 지역 밖에 있던 방문 장소의 지역이 record_regions에 빠져,
 * 그 기록이 장소 상세에는 보이지만 해당 지역 상세에는 안 보이는 불일치가 그대로 남았다.
 *
 * 빠진 지역을 장소에서 따라온 지역으로 채운다. 좌표는 서버 저장 규칙과 같게 장소 좌표를 쓴다.
 */
insert into public.record_regions (
  record_id, region_code, region_name, region_label, region_latitude, region_longitude, selected_directly
)
select distinct on (link.record_id, place.region_code)
  link.record_id,
  place.region_code,
  named.region_name,
  (string_to_array(named.region_name, ' '))[array_length(string_to_array(named.region_name, ' '), 1)],
  place.latitude,
  place.longitude,
  false
from public.record_places as link
join public.places as place on place.id = link.place_id
cross join lateral (
  /**
   * 지역명이 없는 옛 장소는 같은 지역 코드를 쓰는 다른 기록·장소의 이름을 빌린다.
   * 마지막 수단인 주소 앞 두 마디는 일반구가 있는 시에서 시 이름까지만 남지만,
   * 코드와 좌표는 정확해 지도와 지역 상세는 제자리를 찾는다.
   */
  select coalesce(
    place.region_name,
    (select other.region_name from public.records as other where other.region_code = place.region_code limit 1),
    (
      select other.region_name
      from public.places as other
      where other.region_code = place.region_code and other.region_name is not null
      limit 1
    ),
    array_to_string((string_to_array(btrim(place.address), ' '))[1:2], ' ')
  ) as region_name
) as named
where char_length(btrim(coalesce(named.region_name, ''))) between 1 and 200
  and not exists (
    select 1
    from public.record_regions as region
    where region.record_id = link.record_id
      and region.region_code = place.region_code
  )
order by link.record_id, place.region_code, place.saved_at nulls last
on conflict (record_id, region_code) do nothing;
