다음 단계로 `/records/new`의 **새 기록 작성 화면**을 구현해줘.

아직 Supabase 저장은 하지 않고, UI와 입력 구조만 완성한다.

이 화면의 목적은 실제 DB schema를 확정하기 전에 "뭐했지"에서 하나의 Record를 만들기 위해 어떤 정보가 필요한지 검증하는 것이다.

## 핵심 입력

새 기록 작성에 필요한 정보는 다음과 같다.

1. 언제
2. 누구와
3. 어디서
4. 무엇을 했는지
5. 메모

사진 첨부 기능은 현재 MVP 범위에서 제외한다.

사진 관련 UI, 타입, mock data, upload placeholder 등을 미리 만들지 않는다.

향후 별도 기능으로 추가할 예정이다.

---

## 날짜

사용자가 함께한 날짜를 선택할 수 있도록 한다.

기본값은 오늘 날짜로 해도 된다.

시간까지 반드시 입력하게 만들지는 않는다.

현재 MVP에서는 날짜 중심으로 기록한다.

---

## 누구와

한 Record에는 한 명 이상의 Person이 연결될 수 있다.

현재는 실제 DB 연동 없이 mock Person 데이터를 사용한다.

예:

```ts
type Person = {
  id: string;
  name: string;
};
```

사용자가 한 명 또는 여러 명을 선택할 수 있도록 설계한다.

모바일에서 빠르게 선택할 수 있어야 하고, 지나치게 복잡한 multi-select UI는 피한다.

향후 `/people` 및 Supabase Person 데이터로 교체할 수 있는 구조로 만든다.

---

## 어디서

장소는 향후 별도의 `Place` entity로 관리할 예정이다.

Record 내부에 장소명, 주소, latitude, longitude 등을 중복 저장하는 구조를 전제로 하지 않는다.

향후 관계는 다음과 같은 방향을 고려한다.

```text
Record
→ placeId
→ Place
```

Place는 향후 다음 정보를 가질 수 있다.

```ts
type Place = {
  id: string;
  name: string;
  address: string;

  latitude: number;
  longitude: number;

  region?: string;
  district?: string;
};
```

현재는 실제 장소 API를 연결하지 않는다.

mock 장소 검색 결과 또는 임시 장소 선택 UI를 만들어도 된다.

향후 실제 장소 검색 API를 연결하기 쉽게 UI와 데이터 책임을 분리한다.

---

## 무엇을 했는지

사용자가 해당 장소에서 무엇을 했는지 짧게 기록할 수 있도록 한다.

예:

- 이자카야 갔다가 산책
- 카페에서 이야기함
- 영화 보고 저녁 먹음
- 드라이브

이 필드는 Record의 핵심 내용이므로 쉽게 입력할 수 있어야 한다.

과도하게 긴 에디터나 rich text editor는 사용하지 않는다.

---

## 메모

추가적으로 남기고 싶은 내용을 작성하는 선택 필드다.

필수 입력으로 만들지 않는다.

일반 textarea 정도면 충분하다.

---

# UX 목표

이 화면에서 가장 중요한 목표는:

> 사용자가 약 30초 안에 기록 하나를 남길 수 있는 것

이다.

따라서:

- 입력 필드를 과도하게 많이 만들지 않는다.
- 불필요한 단계형 wizard를 만들지 않는다.
- 한 화면에서 자연스럽게 기록할 수 있도록 한다.
- 필수 항목과 선택 항목을 명확하게 구분한다.
- 모바일 키보드가 올라오는 상황을 고려한다.
- CTA가 모바일에서 쉽게 접근 가능해야 한다.

모바일 PWA 약 390px 너비를 우선한다.

---

# 제출 버튼

화면의 주요 CTA는:

`기록 남기기`

로 한다.

현재는 Supabase에 저장하지 않는다.

mock submit 처리 또는 form validation까지만 구현해도 된다.

실제 저장 로직이 없는 상태에서 성공한 것처럼 영구 데이터를 생성하지 않는다.

---

# UI

현재 프로젝트의 디자인 시스템을 그대로 사용한다.

- shadcn/ui
- Lucide
- semantic color token
- 기존 typography
- 기존 spacing
- 기존 radius

필요한 shadcn/ui component가 이미 설치되어 있으면 재사용한다.

필요한 component가 없다면 실제 필요한 것만 shadcn CLI로 추가한다.

동일한 기능의 custom component를 불필요하게 다시 만들지 않는다.

Lucide 아이콘을 사용하고 별도의 icon library를 추가하지 않는다.

---

# FSD

현재 프로젝트의 FSD 규칙을 유지한다.

`src/app`은 Next.js 라우팅 전용으로 유지한다.

`src/app/(app)/records/new/page.tsx`는 실제 화면을 직접 구현하지 않고 대응하는 `_pages` 화면을 렌더링하는 얇은 entry point로 유지한다.

필요에 따라 다음과 같은 구조를 사용할 수 있다.

```text
src/_pages/record-new/
├── ui/
│   └── record-new-page.tsx
├── model/
│   └── ...
└── index.ts
```

단, 아직 필요하지 않은 segment와 파일을 FSD 형식을 맞추기 위해 미리 생성하지 않는다.

Person 선택처럼 나중에 여러 화면에서 재사용되는 명확한 사용자 행동이 생겼을 때만 `features` 승격을 고려한다.

MVP 단계에서 지나친 추상화를 하지 않는다.

---

# 향후 도메인 방향

현재 UI를 구현하면서 다음 관계를 염두에 둔다.

```text
Record
├── recordedAt
├── activity
├── memo
├── Place
└── Person[]
```

장소와 사람은 Record와 독립된 entity가 될 예정이다.

특히 장소의 latitude/longitude는 향후 홈의 대한민국 activity map과 연결된다.

```text
Record
→ Place
→ latitude / longitude
→ Korea Activity Map Cell
```

지도 cell id 자체를 Record의 원본 위치 정보로 사용하지 않는다.

---

# 제외 범위

이번 작업에서는 다음을 구현하지 않는다.

- Supabase integration
- DB schema/migration
- Auth
- 실제 장소 API
- 실제 저장
- 사진 첨부
- Supabase Storage
- 이미지 업로드
- 이미지 preview
- 위치 자동 감지
- 지도 선택 UI
- record 상세 화면

이번 작업의 목적은 **새 기록을 빠르게 입력할 수 있는 UI와 Record 입력 모델을 검증하는 것**이다.

---

# 구현 완료 후

다음을 정리해줘.

1. 생성하거나 수정한 파일
2. 필수 입력 필드
3. 선택 입력 필드
4. Record에 필요한 데이터
5. Place entity로 분리해야 하는 데이터
6. Person과 Record의 관계
7. 실제 Supabase schema 설계 시 고려해야 할 관계
8. 실제 장소 검색 API를 붙일 때 교체할 부분

마지막으로:

- lint
- TypeScript type check
- biome write

를 실행하고 오류가 있다면 수정해.
