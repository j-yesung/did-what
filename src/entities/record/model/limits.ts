/**
 * 한 기록이 담을 수 있는 방문 지역과 방문 장소의 수. 작성 화면과 서버 액션이 이 값을 쓴다.
 * DB 함수 sync_owned_record_regions와 prepare_owned_record_places도 10을 따로 검사하므로, 바꿀 때는 마이그레이션도 함께 고친다.
 */
export const MAX_VISITED_REGIONS = 10;
export const MAX_VISITED_PLACES = 10;
