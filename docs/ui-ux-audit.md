# 뭐했지 UI/UX 감사 보고서

작성일: 2026-08-14  
갱신일: 2026-08-15  
대상: 현재 워크트리의 `app/`, `src/pages/`, `src/widgets/`, `src/features/`, `src/entities/`, `src/shared/ui/`  
관점: 사용 흐름, 정보 구조, 모바일 조작성, 반응형, 접근성, shadcn/Base UI 구성 일관성, 시각적 완성도, 구현 복잡도

## 결론

현재 UI는 모바일 중심의 폭, 안전 영역, 폼 라벨, 빈 상태, 삭제 확인, 포커스 스타일 등 기본기는 잘 갖춰져 있다. 가장 큰 문제는 화면별 장식보다 **공통 컴포넌트의 의미와 상태 처리**에 있다. 링크를 Base UI 버튼으로 렌더링하는 방식, 매우 옅은 입력 경계, 라우트 상태 화면 부재가 여러 사용자 흐름에 동시에 영향을 준다.

확인된 개선 항목은 총 25개이며, 현재 22개가 남아 있다.

| 우선순위 | 남은 개수 | 의미 |
| --- | ---: | --- |
| 높음 | 6 | 주요 흐름 방해, 오동작 가능성, 접근성 기준 미달 가능성이 커서 먼저 수정 |
| 보통 | 12 | 반복되는 조작성·일관성·정보 구조 문제 |
| 낮음 | 4 | 완성도와 문구 품질을 높이는 마감 항목 |

## 감사 방법과 범위

- `web-design-guidelines`, `shadcn`, `frontend-design`, `playwright`, `ponytail` 기준을 함께 적용했다.
- shadcn CLI로 현재 프로젝트가 Next.js 16.3, Tailwind CSS v4, `base-nova`, Base UI 기반임을 확인했다.
- 공개 화면은 실제 브라우저의 390×844 모바일 뷰포트에서 확인했다.
- 인증이 필요한 화면은 계정이나 데이터를 새로 만들지 않고 서버 컴포넌트, 공통 UI, 상태 분기, 반응형 클래스를 정적 분석했다.
- 색 대비 수치는 현재 토큰의 실제 색상값으로 계산했다.
- 최초 감사 결과와 이후 완료 상태를 함께 관리한다. 이 문서 자체에서 코드나 DB 변경을 지시하지 않는다.

## 높은 우선순위

### H-01. 시작 화면이 이미 렌더링된 앱 전체를 영구히 가릴 수 있다 — 완료

- 앱 시작 오버레이와 전용 이미지를 제거해 서버가 반환한 첫 페이지를 바로 표시한다.
- 이미지 로드와 hydration이 끝날 때까지 빈 배경이 콘텐츠를 가리던 경로가 사라졌다.

### H-02. 페이지 이동 링크 11곳이 접근성 트리에서 버튼으로 노출된다

- 근거: `src/pages/auth/ui/auth-page.tsx:157`, `src/pages/home/ui/home-page.tsx:38`, `src/pages/people/ui/people-page.tsx:51`, `src/entities/record/ui/record-card.tsx:53`, `src/shared/ui/pagination.tsx:34` 외 6곳
- `Button` 또는 `TextButton`에 `nativeButton={false}`와 `render={<Link />}`를 결합한다. Base UI 버튼의 의미가 남아 실제 로그인 화면에서 “회원가입” 이동이 링크가 아닌 버튼으로 노출되는 것을 확인했다.
- 새 탭 열기, 링크 주소 복사, 링크 탐색 모드 등 브라우저와 보조기기의 기본 링크 동작을 약화시킨다.
- 제안: 이동은 `<Link className={buttonVariants(...)}>` 또는 `<Link className={textButtonVariants(...)}>`로 직접 렌더링한다. 명령만 `Button`으로 유지한다.

### H-03. 입력창 테두리와 포커스 경계가 너무 옅다

- 근거: `src/shared/ui/input.tsx:13`, `src/shared/ui/textarea.tsx:10`, `src/app/styles/globals.css:101`, `src/app/styles/globals.css:102`
- 라이트 모드 입력 테두리 `#d1d6db`는 흰색 대비 약 1.46:1, 앱 배경 대비 약 1.40:1이다. 포커스 색 `#64a8ff`도 흰색 대비 약 2.45:1이다. 그래서 `border`가 있어도 육안상 거의 보이지 않는다. prop 문제가 아니다.
- 같은 토큰을 쓰는 모든 로그인, 검색, 사람 추가, 기록 작성 입력에 동시에 영향을 준다.
- 제안: 기본 경계와 포커스 경계를 각각 최소 3:1로 조정하고, 다크 모드도 별도로 검증한다. 테두리만 진하게 하기보다 배경·링·테두리 세 요소를 한 세트로 조정한다.

### H-04. 지도는 핵심 화면인데 방문 정보를 해석하거나 탐색할 수 없다

- 근거: `src/pages/home/ui/home-page.tsx:20`, `src/pages/home/ui/korea-activity-map.tsx:15`, `src/pages/home/ui/korea-activity-map.tsx:28`
- 시각적으로는 색 농도만 있고 범례, 지역명, 지역별 횟수, 선택 동작이 없다. 사용자는 “어디를 얼마나 방문했는지”보다 대한민국 실루엣만 보게 된다.
- 스크린 리더에는 전체 기록 개수만 전달되고, 실제 지역 데이터가 든 셀 전체는 `aria-hidden`이다.
- 인접 농도 단계의 대비도 약 1.21:1~1.66:1이라 색만으로 단계를 빠르게 구분하기 어렵다.
- 제안: 최소한 범례와 “방문 지역 N곳” 요약을 추가한다. 다음 단계로 지역 선택 시 이름·횟수·최근 기록을 보여주고, 보조기기용 지역별 텍스트 목록을 함께 제공한다.

### H-05. 예외·404가 서비스 UI로 설계되어 있지 않다

- 근거: `app/` 아래 `error.tsx`, `not-found.tsx`가 없음
- 빠른 화면 이동에는 별도 로딩 화면을 끼우지 않고 현재 화면을 유지한다. 앱 첫 진입의 인증 대기만 layout의 fallback으로 표시한다.
- 예외와 잘못된 상세 URL은 Next.js 기본 화면에 의존해 앱의 맥락과 복귀 동선을 잃는다.
- `LoadErrorAlert`는 쿼리가 정상적으로 결과를 반환한 경우만 다루며 렌더링 예외와 404는 다루지 못한다.
- 제안: 앱 그룹에 `error.tsx`, `not-found.tsx`를 만들고 “다시 시도”, “목록으로”, “홈으로” 복구 동선을 제공한다.

### H-06. 사람 삭제의 주 사용 맥락과 기능 위치가 어긋난다

- 근거: `src/pages/people/ui/people-page.tsx:39`, `src/pages/person-detail/ui/person-detail-page.tsx:56`
- 사람 목록에서는 상세 이동만 가능하고 삭제하려면 상세 화면에 들어가야 한다. 정리 작업은 목록을 보며 연속해서 하는 흐름인데 매번 진입·뒤로 가기를 요구한다.
- 제안: 사람 카드 footer에 상세/수정과 함께 삭제 진입점을 제공한다. 삭제 확인 문구와 연결 기록 영향 안내는 현재 `DeletePersonDialog`를 그대로 재사용한다.

### H-07. 기록 작성 이탈 방지가 헤더 버튼과 문서 이탈만 감시한다

- 근거: `src/features/manage-record/ui/record-form.tsx:65`, `src/shared/ui/layouts/back-button.tsx:38`
- `beforeunload`와 앱 헤더의 뒤로 가기만 처리한다. 브라우저의 SPA 히스토리 이동, 모바일 뒤로 가기 제스처 등은 같은 확인 UI를 거치지 않을 수 있다.
- 작성 폼이 길고 입력 비용이 큰 만큼 한 번의 누락도 신뢰도에 큰 영향을 준다.
- 제안: 라우터 이동과 `popstate`를 포함해 동일한 guard로 통합하거나, 임시 초안 자동 저장을 제공한다. 최소한 실제 iOS/Android 뒤로 가기 시나리오를 E2E로 고정한다.

## 보통 우선순위

### M-01. 공통 버튼과 선택 칩의 모바일 터치 영역이 작다

- 근거: `src/shared/ui/button.tsx:27`, `src/shared/ui/button.tsx:28`, `src/shared/ui/button.tsx:35`, `src/shared/ui/checkbox-chip.tsx:11`, `src/features/manage-record/ui/record-location-fields.tsx:133`
- 공통 버튼은 24~36px, 칩은 36px 높이가 기본이다. 실제 주요 입력은 44px로 덮어쓴 곳도 있지만 작은 버튼, 다이얼로그 닫기, 장소 제거, pagination에는 그대로 남는다.
- 제안: 모바일 기본 hit area를 44×44px로 보장한다. 시각 크기를 유지하려면 투명 pseudo-element로 실제 클릭 영역만 넓힌다.

### M-02. 일부 일반 텍스트 색상도 대비가 경계값 아래다

- 근거: `src/app/styles/globals.css:66`, `src/app/styles/globals.css:70`, `src/app/styles/globals.css:72`
- 보조 텍스트 `#6b7684`는 앱 배경 대비 약 4.42:1, 흰 글자의 브랜드 버튼 `#2272eb`은 약 4.49:1, 라이트 모드 위험 텍스트 `#f04452`는 흰색 대비 약 3.63:1이다.
- 큰 글자나 굵은 글자는 통과할 수 있지만 10~14px 보조 문구와 작은 텍스트 버튼에는 여유가 없다.
- 제안: 토큰 단계에서 한 단계씩 진하게 조정하고 `text-xs`, `text-[10px]` 사용처를 함께 재검증한다.

### M-03. 홈 화면에 페이지 제목과 지도 해석을 위한 시각적 헤더가 없다

- 근거: `src/pages/home/ui/home-page.tsx:18`
- 홈은 `<main>`과 지도만 있고 `<h1>`이 없다. 다른 탭의 `PageHeader` 패턴과도 달라 현재 위치와 화면 목적이 약하다.
- 제안: 지도를 가리지 않는 작은 제목/요약 영역을 두거나, 시각적으로 숨긴 `<h1>`과 가시적인 요약·범례 조합을 제공한다.

### M-04. 인증 후 모든 페이지의 문서 제목이 동일하다

- 근거: `app/layout.tsx:23`; 개별 metadata는 `app/(auth)/login/page.tsx:4`, `app/(auth)/signup/page.tsx:4`에만 있음
- 기록, 장소, 사람, 설정, 상세 화면이 모두 브라우저 탭과 방문 기록에서 “뭐했지”로 보인다.
- 제안: 각 route에 정적 metadata를, 상세 route에는 `generateMetadata`를 추가해 “기록 상세 · 뭐했지”처럼 구분한다.

### M-05. 키보드 사용자를 위한 본문 바로가기 링크가 없다

- 근거: `app/layout.tsx:56`, `src/shared/ui/layouts/page-shell.tsx:17`
- 반복되는 헤더와 탐색을 건너뛰는 skip link가 없다.
- 제안: root layout 첫 포커스 요소로 “본문으로 건너뛰기”를 두고 모든 `PageShell`의 `main`에 공통 id를 부여한다.

### M-06. 공통 다이얼로그가 작은 화면·키보드·모션 감소를 충분히 다루지 않는다

- 근거: `src/shared/ui/dialog.tsx:54`, `src/shared/ui/alert-dialog.tsx:49`
- 검색 다이얼로그는 개별적으로 높이를 제한하지만 공통 `DialogContent`와 `AlertDialogContent`에는 `max-height`, 내부 스크롤, `overscroll-contain`이 없다. 긴 이름이나 시스템 글자 확대, 가로 화면, 소프트 키보드에서 footer가 화면 밖으로 밀릴 수 있다.
- dialog/alert-dialog의 zoom·fade 애니메이션에는 공통 `motion-reduce` 예외가 없다.
- 제안: 공통 content에 viewport 기반 최대 높이와 overscroll 정책을 두고, body/footer를 분리해 footer를 유지한다. 모션 감소 시 변형 애니메이션을 제거한다.

### M-07. 수정·삭제 다이얼로그와 상세 액션 비율 규칙이 화면마다 다르다

- 근거: `src/shared/ui/dialog.tsx:78`, `src/shared/ui/alert-dialog.tsx:71`, `src/features/manage-person/ui/rename-person-dialog.tsx:42`, `src/features/manage-person/ui/delete-person-dialog.tsx:34`, `src/pages/record-detail/ui/record-detail-page.tsx:52`
- 이름 수정은 일반 Dialog의 좌측 정렬, 삭제는 AlertDialog의 중앙 정렬을 사용해 같은 대상 관리 흐름인데 인상이 다르다. footer는 `equal/split` 규칙이 있지만 기록 상세의 수정/삭제 버튼에는 같은 비율 원칙이 적용되지 않는다.
- 제안: 정보성/입력/위험 다이얼로그의 차이는 색과 문구로만 표현하고 header 간격·정렬·footer 높이는 통일한다. `[수정][삭제]`은 공통 action group으로 묶어 기본 `1:1`, 필요 시 `split`을 명시한다.

### M-08. 로그인·회원가입 서버 검증 실패 후 오류 필드로 포커스가 이동하지 않는다

- 근거: `src/pages/auth/ui/auth-page.tsx:42`, `src/pages/auth/ui/auth-page.tsx:95`
- 필드 오류는 표시되지만 제출 후 사용자가 첫 오류를 다시 찾아야 한다. 사람 추가와 기록 폼에는 이미 첫 invalid 필드로 이동하는 패턴이 있다.
- 제안: 인증 폼에도 동일한 `formRef`와 실패 시 첫 `[aria-invalid="true"]` 포커스 이동을 적용한다.

### M-09. 기록 필터는 좁은 화면에서 정보와 조작이 과밀하다

- 근거: `src/pages/records/ui/record-filter-form.tsx:46`, `src/pages/records/ui/record-filter-form.tsx:63`, `src/pages/records/ui/record-filter-form.tsx:75`
- 기간 badge에 두 날짜가 한 줄로 들어가고, 날짜 입력 두 개도 항상 한 행이다. 320px급 화면이나 글자 확대에서 잘림과 압축 가능성이 크다.
- 정렬/초기화 컨트롤은 32px 높이라 터치하기 작고 활성 상태도 얇은 색 차이에 주로 의존한다.
- 제안: 매우 좁은 폭에서는 날짜 입력을 세로 배치하고, 기간 요약은 줄바꿈 또는 짧은 현지화 형식을 사용한다. 필터 버튼은 44px hit area와 체크 아이콘/굵기 차이를 함께 쓴다.

### M-10. 사람 카드가 공간을 많이 쓰지만 비교에 필요한 정보는 적다

- 근거: `src/pages/people/ui/people-page.tsx:41`
- 모든 카드에 “함께한 사람”, “새 기록에서 이 사람을 선택할 수 있어요”가 반복된다. 반면 기록 수, 최근 함께한 날짜처럼 목록에서 비교할 정보는 없다.
- 제안: 반복 설명을 제거하고 이름, 기록 수, 최근 기록일, 관리 액션을 한 카드에 압축한다. 목록의 목적을 “사람 선택·정리·기록 탐색”으로 명확히 한다.

### M-11. 설정 화면은 정보 구조에 비해 카드와 빈 공간이 과하다

- 근거: `src/pages/settings/ui/settings-page.tsx:17`, `src/pages/settings/ui/settings-page.tsx:24`
- 프로필 카드와 `flex-1` 설정 카드 두 개로 나뉘어 내용이 적은데도 큰 빈 면이 생긴다. 닉네임은 보여주지만 수정할 수 없어 프로필 카드의 목적도 약하다.
- 제안: 계정, 화면, 세션 섹션을 한 설정 목록 구조로 묶고 닉네임 수정 진입점을 제공한다. 로그아웃은 별도 위험/세션 섹션 하단에 둔다.

### M-12. 데스크톱에서는 상호작용 가능 여부를 알려주는 hover 피드백이 거의 없다

- 근거: `src/shared/lib/interaction.ts:10`, `src/shared/ui/button.tsx:17`, `src/shared/ui/text-button.tsx:16`
- 공통 상호작용은 `active`와 focus에 집중되어 있고 button/text-button variant에는 일반 hover 상태가 없다. 넓은 화면도 지원하지만 마우스 사용자는 클릭 가능성을 눌러 보기 전까지 확인하기 어렵다.
- 제안: `@media (hover: hover)` 환경에서만 배경·텍스트·밑줄 중 하나의 절제된 hover 상태를 공통 variant에 추가한다.

## 낮은 우선순위

### L-02. 입력 예시와 진행형 placeholder 문장 형식이 통일되지 않았다

- 근거: `src/pages/auth/ui/auth-page.tsx:89`, `src/pages/records/ui/record-filter-form.tsx:37`, `src/features/manage-record/ui/record-form.tsx:200`
- 일부는 예시, 일부는 명령형 문장, 일부는 마침표까지 포함한다. 검색·비동기 입력은 진행 가능성을 나타내는 말줄임표도 없다.
- 제안: 예시는 `예: …`, 검색은 `… 검색`, 안내 문장은 label/description으로 옮기는 규칙을 정한다.

### L-03. 공통 접근성 기본 문구 일부가 영어다

- 근거: `src/shared/ui/spinner.tsx:10`, `src/shared/ui/pagination.tsx:13`, `src/shared/ui/pagination.tsx:59`
- 실제 사용처에서 한국어로 덮어쓰는 경우도 있지만 공통 기본값은 `Loading`, `pagination`, `Go to previous page`다.
- 제안: 서비스 기본 언어에 맞춰 “불러오는 중”, “페이지 이동”, “이전 페이지”로 통일한다.

### L-04. 지도 설명은 초록색이라고 하지만 실제 지도 토큰은 파란색이다

- 근거: `src/pages/home/ui/korea-activity-map.tsx:25`, `src/app/styles/globals.css:114`
- 보조기기 설명과 실제 시각 표현이 다르다.
- 제안: 색 이름을 제거해 “색 농도”라고 표현하거나 실제 토큰 이름과 동기화한다.

### L-05. PWA manifest 색과 실제 앱 테마 색이 다르다

- 근거: `app/manifest.ts:14`, `app/layout.tsx:21`, `src/app/styles/globals.css:26`
- manifest는 `#FAFAF8`, 실제 라이트 배경은 `#f9fafb`, 다크 선택 시에도 manifest 시작 배경은 라이트로 고정된다. 설치 앱 시작 시 짧은 색 전환이 보일 수 있다.
- 제안: manifest와 viewport의 색 기준을 한 상수 또는 생성 규칙으로 맞추고, 다크 모드 시작 장면을 실제 기기에서 확인한다.

## 완료된 항목

### L-01. 하단 내비게이션 라벨 크기

- 라벨을 12px로 높이고 한 줄 표시를 유지하도록 수정했다.

### L-06. 메모 글자 수 표시

- 메모에 포커스가 있을 때 `현재/500` 글자 수가 표시되며, 수정 화면에서는 기존 메모 길이부터 시작한다.

## 화면별 요약

| 화면 | 잘 된 점 | 가장 먼저 손볼 점 |
| --- | --- | --- |
| 로그인·회원가입 | 명시적 label, autocomplete, 44px 입력, 화면 내 오류 유지 | 링크 의미, 오류 포커스, 입력 경계 대비 |
| 홈 지도 | 모바일 화면을 넓게 쓰고 핵심 CTA가 명확함 | 범례·지역 데이터·대체 텍스트, 페이지 제목 |
| 기록 목록 | URL 기반 검색/기간/정렬, 빈 결과 상태 | 좁은 화면 필터 밀도, 작은 정렬/초기화 타깃 |
| 기록 작성·수정 | 필수/선택 구분, 첫 오류 포커스, 장소 변경 확인 | 실제 모바일 뒤로 가기까지 이탈 보호 |
| 사람 목록·상세 | 추가 폼과 삭제 영향 안내가 명확함 | 목록 즉시 삭제, 반복 문구 제거, 기록 수 노출 |
| 장소 목록·상세 | 저장/검색/빈 상태가 분리되고 목록 카드의 중복 제거 액션이 정리됨 | 삭제와 기록 보기의 시각적 위계 정돈 |
| 설정 | 테마 선택이 단순하고 44px 행을 사용 | 정보 구조 압축, 닉네임 관리, 로그아웃 분리 |
| 공통 UI | 시맨틱 토큰, 안전 영역, focus-visible, motion 일부 대응 | 대비, 터치 크기, 링크/버튼 의미, 라우트 상태 |

## 이미 잘 된 부분

- `PageShell`과 하단 내비게이션이 safe-area를 반영하고 앱 폭을 일관되게 유지한다.
- 주요 폼은 label, `autocomplete`, `aria-invalid`, `aria-describedby`를 대부분 올바르게 연결한다.
- destructive action은 `AlertDialog`를 사용하고 삭제 결과와 연결 데이터 영향을 설명한다.
- 검색/빈 목록/로드 실패를 단순히 빈 화면으로 두지 않고 각각의 상태 문구를 제공한다.
- 기록 작성 폼은 서버 검증 실패 시 첫 오류로 포커스를 옮기고 중복 제출을 막는다.
- 색 외에도 체크, 아이콘 채움, 굵기 등 보조 상태 표현을 일부 함께 사용한다.
- 필터 상태를 URL에 보존해 새로고침과 공유, 뒤로 가기에 강하다.

## 권장 수정 순서

1. **공통 기반:** 링크를 실제 `Link`로 교체하고, 입력/텍스트 대비와 최소 터치 영역을 토큰·variant 수준에서 수정한다.
2. **실패 복구:** 공통 `error`, `not-found` 화면을 추가한다.
3. **핵심 가치:** 지도에 범례·지역별 요약·탐색 동작을 추가한다.
4. **주요 관리 흐름:** 사람 목록 즉시 삭제와 기록 이탈 보호를 정리한다.
5. **일관성:** 다이얼로그 정렬·footer 비율, 필터 반응형, 설정 정보 구조를 통일한다.
6. **마감:** placeholder, 한국어 접근성 문구, PWA 색을 다듬는다.

## 완료 판정 체크리스트

- 모든 화면 이동 요소가 접근성 트리에서 링크로 노출된다.
- 입력 경계와 focus indicator가 라이트·다크 모두 배경 대비 3:1 이상이다.
- 일반 크기 텍스트가 배경 대비 4.5:1 이상이다.
- 모바일 주요 조작의 실제 hit area가 44×44px 이상이다.
- JS 또는 이미지 로딩 실패 시에도 앱 콘텐츠와 복구 동선이 보인다.
- 라우트 전환 중 로딩 상태가 전달되고, 렌더링 예외와 404 상태에 복귀 동선이 있다.
- 지도 정보를 색 없이도 지역명과 횟수로 이해할 수 있다.
- 320px 폭, 200% 글자 확대, 소프트 키보드가 열린 상태에서도 필터와 다이얼로그 footer가 잘리지 않는다.
- 사람 목록에서 삭제까지 한 화면 안에서 끝난다.
- 기록 작성 중 헤더 버튼, 브라우저 뒤로 가기, 모바일 제스처 모두 같은 이탈 보호를 거친다.
