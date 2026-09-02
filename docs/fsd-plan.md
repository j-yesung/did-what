분석 결과에 동의해. 제안한 기준대로 실제 구조 변경까지 진행해줘.

적용 원칙은 다음과 같이 정리하자.

* Page Slice가 하위 Layer를 조합하는 얇은 진입점이라면 `ui/`를 제거한다.
* Page Slice가 자체적인 화면 구조를 소유하거나 페이지 전용 UI가 여러 개 존재한다면 `ui/`를 유지한다.
* 단순 파일 수나 줄 수만으로 판단하지 말고, orchestration-only인지 자체 UI composition을 가지는지를 우선 기준으로 한다.
* `model`, `api`, `lib` 등 다른 segment가 존재해 UI와 비-UI 관심사를 구분할 필요가 있으면 `ui/`를 유지한다.
* 서버/클라이언트 렌더링 경계가 분리된 경우에도 `ui/`를 유지한다.

따라서 아래 Slice는 분석 결과대로 `ui/`를 제거해줘.

```text
src/pages/home/ui/home-page.tsx
→ src/pages/home/home-page.tsx

src/pages/record/new/ui/record-new-page.tsx
→ src/pages/record/new/record-new-page.tsx

src/pages/record/edit/ui/record-edit-page.tsx
→ src/pages/record/edit/record-edit-page.tsx

src/pages/region/list/ui/regions-page.tsx
→ src/pages/region/list/regions-page.tsx

src/pages/settings/ui/settings-page.tsx
→ src/pages/settings/settings-page.tsx
```

아래 Slice는 `ui/`를 유지해줘.

```text
src/pages/auth
src/pages/record/list
src/pages/record/detail
src/pages/place/list
src/pages/place/detail
src/pages/region/detail
```

추가로 `src/pages/auth`는 한 단계 더 정리해줘.

현재 `auth-page.tsx` 한 파일 안에 `LoginPage`, `SignupPage`, 공통 `AuthPage`가 함께 들어가 있으므로 책임을 분리하는 것이 적절해 보여.

실제 코드를 확인한 뒤 다음과 비슷한 구조로 분리해줘.

```text
src/pages/auth/
└── ui/
    ├── auth-page.tsx
    ├── login-page.tsx
    └── signup-page.tsx
```

단, 실제 역할을 확인했을 때 `AuthPage`가 공통 shell/layout에 더 가깝다면 파일명은 더 적절하게 변경해도 된다.

예:

```text
auth-layout.tsx
login-page.tsx
signup-page.tsx
```

중요:

* 중복 코드를 만들지 않는다.
* Login/Signup에서 공유하는 UI나 로직은 공통 컴포넌트로 유지한다.
* 단순히 파일을 쪼개기 위한 분리는 하지 않는다.
* 각 파일이 하나의 명확한 책임을 가지도록 분리한다.
* 기존 route, UI, 비즈니스 로직, validation, API contract는 변경하지 않는다.
* 기존 Public API인 `index.ts` export도 새 구조에 맞게 수정한다.
* deep import가 생기지 않도록 한다.

작업 완료 후에는 다음만 확인해줘.

1. 변경된 `src/pages` 구조 출력
2. `auth` 파일 분리 결과 설명
3. 수정한 주요 import/export 정리
4. 잘못된 deep import 여부 확인
5. `pnpm typecheck` 실행

이번 작업에서는 전체 test suite, production build, 브라우저 테스트는 수행하지 않는다.
