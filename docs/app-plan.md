다음 단계로 Supabase MCP를 사용해서 "뭐했지"의 MVP 데이터베이스 스키마를 설계하고 migration을 만들어줘.

현재 `/records/new` UI에서 검증된 입력 모델은 다음과 같다.

```ts
type RecordFormValues = {
  recordedAt: string;
  personIds: string[];
  placeId: string;
  activity: string;
  memo?: string;
};
```

현재 도메인 관계는 다음과 같다.

```text
User
├── People
├── Places
└── Records

Record
├── Place 1개
└── Person 여러 명

Record ↔ Person = N:M
```

## 목표

MVP에서 필요한 최소 테이블만 만든다.

필요한 테이블:

- profiles
- people
- places
- records
- record_people

사진 관련 테이블이나 Storage는 아직 만들지 않는다.

---

## profiles

Supabase Auth의 `auth.users`와 1:1로 연결한다.

예상 필드:

```text
id uuid PK → auth.users.id
display_name text nullable
created_at timestamptz
updated_at timestamptz
```

불필요한 프로필 필드는 추가하지 않는다.

---

## people

사용자가 기록에 함께 연결하는 사람.

예상 필드:

```text
id uuid PK
owner_id uuid NOT NULL → auth.users.id
name text NOT NULL
created_at timestamptz
updated_at timestamptz
```

MVP에서는 관계 타입(연인/친구/지인)을 필수로 만들지 않는다.

향후 필요하면 확장할 수 있도록 한다.

---

## places

사용자가 방문한 장소.

예상 필드:

```text
id uuid PK
owner_id uuid NOT NULL → auth.users.id

name text NOT NULL
address text

latitude double precision NOT NULL
longitude double precision NOT NULL

region text
district text

provider text
provider_place_id text

created_at timestamptz
updated_at timestamptz
```

중요:

- 지도 cell ID를 저장하지 않는다.
- 위도/경도가 원본 위치 데이터다.
- 홈 activity map은 latitude/longitude에서 cell을 계산한다.
- 향후 Kakao/Naver 등 장소 provider를 사용할 수 있도록 provider/provider_place_id는 nullable로 둔다.

---

## records

하나의 발자취 기록.

예상 필드:

```text
id uuid PK
owner_id uuid NOT NULL → auth.users.id
place_id uuid NOT NULL → places.id

recorded_at date NOT NULL
activity text NOT NULL
memo text nullable

created_at timestamptz
updated_at timestamptz
```

현재 MVP에서는 시간까지 필수로 기록하지 않으므로 `recorded_at`은 date를 사용한다.

---

## record_people

Record와 Person의 N:M 관계.

예상 필드:

```text
record_id uuid → records.id
person_id uuid → people.id
created_at timestamptz
```

복합 primary key 또는 unique constraint를 사용해서 같은 person이 하나의 record에 중복 연결되지 않도록 한다.

---

# Ownership

모든 사용자 데이터는 owner 기준으로 격리한다.

다음 테이블에는 owner_id가 존재한다.

- people
- places
- records

`record_people`은 연결된 record/person의 ownership을 기준으로 접근을 제한한다.

---

# RLS

RLS를 모든 사용자 데이터 테이블에 적용한다.

사용자는 자신의 데이터만:

- SELECT
- INSERT
- UPDATE
- DELETE

할 수 있어야 한다.

기본 원칙:

```sql
auth.uid() = owner_id
```

을 사용한다.

`record_people`은 단순히 authenticated user에게 전체 허용하지 않는다.

연결되는 `records`와 `people`이 모두 현재 사용자의 소유인지 검증하는 정책을 만든다.

다른 사용자의 record와 person을 임의로 연결할 수 없어야 한다.

---

# Foreign Key 삭제 정책

삭제 시 orphan 데이터가 남지 않도록 적절한 ON DELETE 정책을 적용한다.

예:

```text
auth user 삭제
→ profile / people / places / records 정리

record 삭제
→ record_people 삭제

person 삭제
→ record_people 삭제
```

단, place 삭제 정책은 records와 관계를 고려해서 임의로 cascade 하지 말고 가장 안전한 방향을 판단해.

---

# Index

실제 조회 패턴을 고려해서 필요한 최소 index만 추가한다.

예상 조회:

- owner별 최신 records
- 특정 person의 records
- 특정 place의 records
- 날짜순 records

과도한 index는 만들지 않는다.

---

# updated_at

필요하면 공용 trigger/function을 사용해 `updated_at`을 자동 갱신할 수 있다.

이미 프로젝트 또는 Supabase에 동일한 trigger 패턴이 존재하면 재사용한다.

---

# Supabase MCP

반드시 현재 연결된 Supabase MCP 프로젝트를 먼저 확인한다.

작업 전에 다음을 확인해줘.

1. 연결된 project ref
2. 기존 public schema table 목록
3. 기존 migration 또는 동일 이름의 table 존재 여부

다른 프로젝트에 연결되어 있거나 예상하지 못한 기존 데이터가 있다면 migration을 적용하지 말고 먼저 보고한다.

현재 새 "뭐했지" 프로젝트이고 충돌이 없다면 migration을 생성하고 적용한다.

---

# 타입 생성

migration 적용 후 Supabase MCP를 통해 현재 schema 기준 TypeScript type을 생성할 수 있다면 생성한다.

현재 프로젝트 FSD 구조에 맞는 적절한 위치를 선택한다.

예:

```text
src/shared/api/supabase/database.types.ts
```

이미 Supabase 관련 구조가 있으면 기존 구조를 따른다.

---

# 제외 범위

이번 작업에서는 다음을 하지 않는다.

- Auth UI
- 로그인/회원가입 화면
- 실제 Record 저장 연결
- 장소 검색 API
- 사진
- Supabase Storage
- 홈 지도 실제 DB 연결
- seed/mock 데이터 삽입
- 과도한 domain abstraction

이번 작업의 목적은 **MVP 데이터베이스 schema와 안전한 RLS를 확정하는 것**이다.

---

# 작업 완료 후

다음을 정리해줘.

1. 생성/수정한 migration 파일
2. 생성된 table 목록
3. 각 table의 핵심 column
4. foreign key 관계
5. ON DELETE 정책
6. RLS 정책
7. 추가한 index
8. 생성한 TypeScript 타입 위치
9. `/records/new`에서 실제 저장 연결 시 필요한 다음 작업
10. 홈 activity map에서 실제 Place 좌표를 조회할 방법

마지막으로:

- migration 적용 결과
- Supabase security advisor 확인 가능 시 결과
- TypeScript 검사
- lint

를 실행하고 문제가 있으면 수정해.
