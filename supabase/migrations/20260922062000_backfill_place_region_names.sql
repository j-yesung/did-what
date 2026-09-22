/**
 * 지역명 칼럼이 생기기 전에 저장된 장소는 region_name이 비어 있다.
 * 서버는 저장된 장소의 방문 지역을 region_name에서 만들기 때문에, 비어 있으면
 * 그 장소의 지역을 방문 지역에 넣지 못하고 record_regions 검증에 걸려 기록 수정이 실패한다.
 *
 * 같은 지역 코드를 이미 쓰고 있는 장소·기록·방문 지역에서 이름을 가져와 채운다.
 * 코드가 같으면 이름도 같아야 하므로 어느 쪽을 골라도 결과는 같다.
 */
update public.places as place
set region_name = source.region_name,
    updated_at = now()
from (
  select region_code, min(region_name) as region_name
  from (
    select region_code, region_name from public.places where region_name is not null
    union all
    select region_code, region_name from public.records
    union all
    select region_code, region_name from public.record_regions
  ) as known
  where char_length(btrim(region_name)) between 1 and 200
  group by region_code
) as source
where place.region_name is null
  and place.region_code = source.region_code;

/**
 * 20260922051500의 백필은 지역명이 없는 장소의 이름을 주소 앞 두 마디로 지었다.
 * 일반구가 있는 시에서는 시 이름까지만 남아 `경기 수원시 장안구`가 `경기 수원시`가 됐다.
 * 장소에서 따라온 지역이니 장소의 지역명을 기준으로 다시 맞춘다.
 */
update public.record_regions as region
set region_name = source.region_name,
    region_label = (string_to_array(source.region_name, ' '))[
      array_length(string_to_array(source.region_name, ' '), 1)
    ]
from (
  select region_code, min(region_name) as region_name
  from public.places
  where region_name is not null
  group by region_code
) as source
where not region.selected_directly
  and region.region_code = source.region_code
  and region.region_name <> source.region_name;
