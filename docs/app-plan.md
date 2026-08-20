# 뭐했지 제품 기획

## 서비스 중심

"뭐했지"는 함께한 사람과 어느 지역에서 시간을 보냈는지를 기록하고, 대한민국 격자 지도에서 지역별 발자취를 돌아보는 관계 기반 라이프로그다.

정확한 상호명보다 `어느 지역에 갔는가`가 기록의 중심이다. 카페나 음식점 같은 특정 장소는 한 기록에 여러 곳을 선택할 수 있는 부가 정보이며 필수가 아니다.

## 핵심 기록 모델

```text
Record
├── Region 1개 (필수)
├── Person 1명 이상
└── Visited Place 0개 이상 (선택)
```

기록의 입력 모델은 다음을 목표로 한다.

```ts
type RecordFormValues = {
  recordedAt: string;
  personIds: string[];
  regionCode: string;
  regionLabel: string;
  regionName: string;
  places: RecordPlaceReference[];
  activity: string;
  memo?: string;
};
```

- 지역은 한 기록에 하나만 연결한다.
- 하루에 여러 지역을 방문했다면 지역별로 기록을 나눈다.
- 방문 장소는 같은 지역 안에서 여러 개 연결할 수 있다.
- 방문 장소 연결과 `내 장소` 저장은 서로 다른 행동이다.

## 지역 기준

지역은 자유 텍스트가 아니라 정규화된 목록에서 검색해 선택한다.

- 도시 지역은 법정동을 사용한다.
- 동이 없는 지역은 읍·면을 사용한다.
- `망원1동`, `망원2동` 같은 숫자 분할 행정동은 노출하지 않는다.
- 리 단위는 노출하거나 저장하지 않는다.
- 화면에는 `시·도 시·군·구 동·읍·면` 전체 경로를 표시한다.
- DB에는 법정구역 코드와 당시 표시명을 함께 저장한다.
- 각 지역은 홈 지도 집계에 사용할 대표 위도·경도를 가진다.

예시:

```text
검색어: 망원
선택지: 서울특별시 마포구 망원동
저장값: 법정구역 코드
```

지역 후보와 좌표 검증은 Kakao Local API의 주소 검색·좌표→행정구역 변환을 사용한다. 법정구역 코드가 있는 `동·읍·면`만 허용하므로 숫자로 분할된 행정동과 리는 자연스럽게 제외된다. 선택 시점에 다시 API로 검증하고 코드, 전체 표시명, 대표 좌표를 기록 스냅샷으로 저장한다.

## 기록 위치 UX

1. `어느 지역에 갔나요?`에서 지역명을 입력한다.
2. 정규화된 지역 검색 결과에서 한 곳을 선택한다.
3. 필요하면 선택한 지역 안의 카페, 식당 등 방문 장소를 검색한다.
4. 방문 장소를 여러 개 추가한다.
5. 선택한 장소별로 `내 장소에 저장` 여부를 정한다.
6. 기록을 저장하면 지역은 필수로, 방문 장소는 선택적으로 연결된다.

지역을 선택하지 않고 장소부터 고르면 첫 장소의 법정동·읍·면을 기록 지역으로 자동 설정한다. 지역이 정해진 뒤에는 같은 지역의 장소만 추가할 수 있다.

지역 필드를 먼저 배치하되 지역 미선택 상태에서도 장소 검색을 막지는 않는다. 이때 장소 검색은 전국 결과를 사용하고, 첫 장소가 선택된 뒤부터 선택된 지역으로 범위를 제한한다.

이미 방문 장소가 연결된 상태에서 지역을 바꾸면 기존 방문 장소가 모두 해제된다는 확인을 먼저 받는다.

## 방문 장소와 내 장소

방문 장소는 기록의 세부 동선이고, 내 장소는 사용자가 간직하기로 선택한 장소 모음이다.

- 기록에 연결한 모든 장소를 자동 저장하지 않는다.
- 선택한 방문 장소마다 `내 장소에 저장`을 별도로 선택한다.
- 이미 저장된 장소는 `저장됨`으로 표시한다.
- 기록에서 장소를 제거해도 내 장소 저장 상태는 유지한다.
- 기록 수정 화면에서는 내 장소 저장만 허용하고 저장 해제는 하지 않는다.
- 저장 해제는 장소 탭에서만 제공한다.
- 장소 저장을 해제해도 기존 기록과 방문 장소 연결은 유지한다.
- 기록에만 연결되고 저장하지 않은 장소는 장소 탭에서 숨기되 기록 상세에는 표시한다.

## 주요 화면

### 홈 지도

- 대한민국을 작은 정사각형 셀로 표현한다.
- 기록의 특정 장소 좌표가 아니라 선택한 지역의 대표 좌표를 셀에 매핑한다.
- 같은 지역의 기록은 같은 셀에 누적한다.
- 여러 지역이 같은 셀에 들어가면 기록 수를 합산해 농도를 표시한다.
- 지도는 전국 발자취를 대략 보여주는 시각화로 유지한다.

### 기록

- 목록과 상세에서 지역을 특정 장소보다 먼저 표시한다.
- 상세에서 방문 장소 여러 곳과 함께한 사람을 확인한다.
- 수정 시 지역과 방문 장소의 일관성 규칙을 동일하게 적용한다.

### 장소

- 사용자가 명시적으로 저장한 장소만 목록에 표시한다.
- 장소 탭에서 직접 검색해 저장할 수 있다.
- 장소 상세에서 해당 장소가 연결된 기록을 확인한다.
- 기록 상세에서 저장하지 않은 방문 장소를 나중에 내 장소로 저장할 수 있다.

## 내비게이션

하단 내비게이션은 다음 다섯 탭으로 구성한다.

```text
지도 → 기록 → 장소 → 사람 → 설정
```

아이콘은 `@phosphor-icons/react`의 `MapPinArea`, `PencilSimple`, `MapPin`, `Users`, `Gear`를 사용한다. 활성 탭은 `fill`, 비활성 탭은 `regular` 굵기로 표시한다.

프로덕션 첫 진입에는 다섯 탭의 전체 라우트와 데이터를 미리 준비한다. 탭을 누르면 하단 내비게이션은 고정한 채 콘텐츠만 짧은 진입 모션으로 전환하고, 프리페치가 끝나지 않은 경우에만 공통 로딩 피드백을 표시한다.

## 목표 데이터 모델

### places

Kakao 장소 정보와 사용자별 저장 상태를 가진다.

```text
id uuid PK
owner_id uuid NOT NULL → auth.users.id
region_code text NOT NULL
name text NOT NULL
address text
latitude double precision NOT NULL
longitude double precision NOT NULL
provider text NOT NULL
provider_place_id text NOT NULL
saved_at timestamptz nullable
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

- `saved_at IS NOT NULL`인 장소만 장소 탭에 표시한다.
- 동일 사용자의 동일 provider 장소는 중복 생성하지 않는다.
- 저장 해제는 행 삭제가 아니라 `saved_at = NULL`로 처리한다.

### records

```text
id uuid PK
owner_id uuid NOT NULL → auth.users.id
region_code text NOT NULL
region_label text NOT NULL
region_name text NOT NULL
region_latitude double precision NOT NULL
region_longitude double precision NOT NULL
recorded_at date NOT NULL
activity text NOT NULL
memo text nullable
created_at timestamptz NOT NULL
updated_at timestamptz NOT NULL
```

### record_places

Record와 방문 Place의 N:M 관계다.

```text
record_id uuid → records.id
place_id uuid → places.id
created_at timestamptz NOT NULL
```

같은 장소가 한 기록에 중복 연결되지 않도록 복합 primary key 또는 unique constraint를 둔다. 연결되는 기록과 장소의 소유자 및 지역이 모두 일치해야 한다.

### record_people

기존과 같이 Record와 Person의 N:M 관계를 유지한다. 연결되는 기록과 사람은 같은 사용자의 소유여야 한다.

## 데이터와 보안 원칙

- 개발 단계의 기존 기록과 장소 데이터는 보존하지 않고 새 스키마 적용 시 초기화한다.
- `people`, `places`, `records`는 `owner_id` 기준으로 RLS를 적용한다.
- `record_people`, `record_places`는 양쪽 데이터의 소유권을 검사한다.
- 지역은 서버에서 Kakao Local API로 재검증하며 클라이언트가 보낸 이름과 좌표를 신뢰하지 않는다.
- 기록 생성·수정과 사람·방문 장소 연결은 DB 함수 하나에서 원자적으로 처리한다.
- 장소의 법정구역 코드는 서버에서 provider 응답과 좌표를 다시 검증한다.

## 명시적 비목표

- 지도 확대와 이동
- 지도 셀 클릭, 툴팁, 지역 상세 패널
- 현재 위치 자동 감지
- Kakao에 없는 사용자 정의 장소
- 한 기록에 여러 지역 연결
- 리 단위 지역
- 숫자로 분할된 행정동 선택
- 사진과 Supabase Storage
- 여러 장소 provider 선행 추상화
