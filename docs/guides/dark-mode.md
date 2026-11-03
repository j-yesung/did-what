# 다크 모드 고정과 복원

## 적용 이유와 범위

2026-11-03부터 앱과 체험 데모를 다크 모드로 고정했다. 우주에서 바라본 대한민국의 밤처럼, 방문한 곳이 어둠 속에서 불빛으로 드러나는 지도 표현을 유지하기 위해서다.

개별 화면이나 팔레트를 바꾸지 않고 테마를 적용하는 서버·클라이언트 진입점만 고정했다. 라이트·시스템 테마 코드와 기존 저장값은 남겨두었으며, 테마 선택 UI는 삭제하지 않고 주석 처리했다.

| 파일 | 현재 동작 |
| --- | --- |
| [theme-cookie.ts](../../src/features/switch-theme/api/theme-cookie.ts) | `getTheme()`이 쿠키와 무관하게 `dark` 반환. 첫 HTML과 `theme-color`부터 다크 적용 |
| [theme-preference.ts](../../src/features/switch-theme/model/theme-preference.ts) | `applyTheme()`이 전달받은 값과 무관하게 `dark` 클래스 적용. 데모에 저장된 라이트·시스템 설정도 화면을 바꾸지 못함 |
| [설정 화면](../../src/pages/settings/index.tsx) | 화면 모드 선택 UI와 관련 import·테마 조회 주석 처리 |
| [데모 설정 화면](../../demo/ui/demo-screens.tsx) | 화면 모드 선택 UI와 관련 import·테마 조회 주석 처리 |
| [데모 제어판](../../demo/ui/demo-shell.tsx) | 앱 화면 모드 선택 UI와 관련 import·표시명 상수 주석 처리 |

## 라이트·다크·시스템 선택 복원

서버·클라이언트의 고정과 선택 UI를 함께 복원한다. UI만 복원하면 선택해도 계속 다크가 적용된다.

### 1. 서버에서 테마 쿠키 다시 읽기

`src/features/switch-theme/api/theme-cookie.ts`를 다음과 같이 복원한다.

```ts
import { cookies } from "next/headers";

import { parseTheme, THEME_COOKIE } from "../model/theme";

export const getTheme = async () => {
  const store = await cookies();
  return parseTheme(store.get(THEME_COOKIE)?.value);
};
```

### 2. 클라이언트에서 전달받은 테마 적용

`src/features/switch-theme/model/theme-preference.ts`의 `applyTheme()`을 복원한다. 나머지 함수는 유지한다.

```ts
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
};
```

### 3. 선택 UI와 테스트 복원

- 실제 설정: `ThemeSelect`, `getTheme` import, `const theme = await getTheme()`, 화면 모드 `PageSection`의 주석을 해제한다.
- 데모 설정: `ThemeSelect` import, `const { theme } = useDemoState()`, 화면 모드 `PageSection`의 주석을 해제한다.
- 데모 제어판: `THEME_OPTIONS`·`Theme` import, `THEME_LABELS` 상수, 앱 화면 모드 `section`의 주석을 해제한다.
- [theme-preference.test.mjs](../../src/features/switch-theme/model/theme-preference.test.mjs)의 다크 고정 테스트를 변경한다. `applyTheme(theme)` 후 `getAppliedTheme()`은 전달한 테마와 같아야 한다. `light`·`dark` 클래스는 해당 모드에서만 존재하고, `system`에서는 둘 다 없어야 한다. 관련 없는 HTML 클래스는 유지해야 한다.

기존 `theme` 쿠키와 데모의 탭별 `sessionStorage` 설정이 다시 적용된다. 쿠키 삭제나 데이터 마이그레이션은 필요 없다. 사용자가 이전에 라이트를 선택했다면 복원 후 라이트로 표시될 수 있다.

## 검증

[검증 가이드](verification.md)에 따라 아래 명령을 실행한다. 서버의 쿠키 읽기를 복원하면 렌더링 방식에 영향을 주므로 빌드도 확인한다.

```sh
pnpm exec biome check --write src app demo
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

브라우저에서는 라이트 쿠키가 있는 상태의 첫 화면·새로고침, 세 모드 전환과 화면 이동, 시스템 모드에서 OS 테마 변경, 실제 설정과 데모 설정·제어판을 확인한다. 상태바의 `theme-color`, `color-scheme`, 주소 검색 화면도 선택한 테마를 따라야 한다.
