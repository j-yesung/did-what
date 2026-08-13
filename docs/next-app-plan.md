# 다음 단계: 설치형 PWA 전환

> 상태: 계획 (2026-08-13)

## 목적

브라우저 탭에서 열던 서비스를 홈 화면에 설치해 전체 화면으로 쓰는 앱으로 만든다. 하단 내비게이션이 화면 바닥에 붙은 지금 구조를 기기 화면 끝까지 확장하고, 노치와 홈 인디케이터를 피해 콘텐츠를 배치한다.

오프라인 동작은 목표가 아니다. 네트워크가 없으면 지금처럼 실패 안내를 보여준다.

## 완료 조건

- iOS Safari의 공유 → 홈 화면에 추가로 설치되고, 실행하면 주소창 없이 열린다.
- Android Chrome의 앱 설치 메뉴로 설치된다.
- 홈 화면 아이콘이 기기 규격에 맞게 잘리거나 여백이 남지 않는다.
- 노치·다이나믹 아일랜드가 화면 헤더를 가리지 않는다.
- 홈 인디케이터가 하단 탭 라벨을 가리지 않는다.
- 하단 내비게이션 배경이 화면 맨 아래까지 닿는다.
- 설치한 앱에서 로그인·기록 작성·지도 조회가 브라우저와 동일하게 동작한다.
- 상태 표시줄 색이 화면 배경과 이어져 보인다.

## 1단계: 아이콘·스플래시 자산과 매니페스트 — 완료

자산 배치 규칙은 두 갈래다. Next.js가 이름을 보고 `<link>`를 자동 생성하는 파일은 라우팅 루트 `app/`에, 매니페스트나 메타데이터가 URL로 참조하는 파일은 `public/`에 둔다. 웹에서 서빙할 필요가 없는 원본과 시안은 `assets/`에 보관한다.

1. `public/icons/`를 만들고 매니페스트가 URL로 참조할 아이콘을 넣는다.
   - `icon-192.png` (192×192, purpose any)
   - `icon-512.png` (512×512, purpose any)
   - `icon-maskable-512.png` (512×512, purpose maskable, 안전 영역 20% 여백 확보)
2. Next.js 파일 규칙 아이콘은 라우팅 루트인 `app/`에 둔다. `src/app/`이 아니다.
   - `app/icon.png` (512×512) — 브라우저 탭과 기본 아이콘
   - `app/apple-icon.png` (180×180, 투명도 없음) — iOS 홈 화면
   - `app/favicon.ico` (32×32) — 레거시 브라우저
3. iOS 네이티브 스플래시는 설치 캐시 때문에 앱 화면 모드와 어긋나므로 사용하지 않는다.
- 웹과 설치형 PWA에서 동일한 앱 시작 컴포넌트를 표시한다.
   - 투명 배경의 `app-start-logo.png`를 화면 중앙에 배치한다.
   - 배경은 `background` 시맨틱 토큰으로 라이트·다크·시스템 모드에 대응한다.
4. `app/manifest.ts`에서 `MetadataRoute.Manifest`를 반환한다.
   - `name: "뭐했지"`, `short_name: "뭐했지"`, `id: "/"`, `lang: "ko"`
   - `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`
   - `background_color: "#FAFAF8"`, `theme_color: "#FAFAF8"`
   - `description`은 `metadata.description`과 같은 문장을 쓴다.
5. `app/layout.tsx`의 `metadata.appleWebApp`에는 `capable`, `title`, `statusBarStyle`만 두고 Apple 전용 capability 메타 태그를 명시한다.
6. iOS는 매니페스트 아이콘을 무시하고 `apple-icon`만 사용한다. 두 자산의 그림이 어긋나지 않게 한다.

검증:

- `/manifest.webmanifest`가 200으로 응답하고 JSON이 유효하다. — 확인
- 생성된 HTML에 `apple-touch-icon`, `icon`, `manifest` 링크가 나오고 `apple-touch-startup-image`는 나오지 않는다.
- DevTools > Application > Manifest에 경고가 없다.
- maskable 아이콘을 원형·둥근 사각형 마스크에 넣어도 도형이 잘리지 않는다.
- iOS 홈 화면 아이콘에 검은 배경이 비치지 않는다.

남은 확인:

- 마스커블 아이콘은 새 512px PWA 아이콘을 공유한다. Android 실기기에서 마스크 잘림을 확인한다.
- 앱 시작 화면은 이미지 로드 직후 300ms 동안 자연스럽게 사라진다.

## 2단계: 세이프 에어리어 대응 — 완료

1. `app/layout.tsx`의 viewport에 `viewportFit: "cover"`를 넣었다. 이 값이 없으면 `env(safe-area-inset-*)`이 항상 0이라 아래 작업이 무의미하다.
2. `PageShell`의 상단 여백을 `calc(24px + env(safe-area-inset-top))`으로 바꿨다. 7개 화면이 이 하나를 공유한다.
3. 로그인·회원가입 화면은 `PageShell`을 쓰지 않아 상하 인셋을 따로 넣었다.
4. 하단 내비게이션은 이미 `pb-[env(safe-area-inset-bottom)]`를 갖고 있어, cover를 켜자 배경이 홈 인디케이터 영역까지 덮는다.
5. `--nav-clearance`가 같은 `env()`를 쓰므로 화면 하단 여백은 자동으로 따라왔다. 수정 불필요.
6. 지역·장소 선택 Dialog의 최대 높이에서 상하 인셋을 뺐다. 작은 화면에서 다이얼로그가 상태 표시줄 밑으로 들어가는 것을 막는다.
7. 좌우 인셋은 넣지 않았다. 매니페스트에서 `orientation: "portrait"`로 고정했고, 세로에서는 좌우 인셋이 0이다. 가로를 허용하게 되면 다시 판단한다.

검증:

- 노치 기기에서 화면 제목이 상태 표시줄에 겹치지 않는다.
- 홈 인디케이터가 탭 라벨을 가리지 않는다.
- 하단 내비게이션 배경과 헤어라인이 화면 좌우 끝까지 닿는다.
- 곡선 모서리에서 잘리는 것이 배경색뿐이다.

## 3단계: 설치 메타데이터와 실행 경험

1. `metadata.appleWebApp`에 `capable: true`, `title: "뭐했지"`, `statusBarStyle: "default"`를 설정했다. `viewport-fit=cover`와 조합할 때 상태 표시줄이 어떻게 보이는지 실기기로 확인해 값을 고른다.
2. `metadata.icons`로 apple-touch-icon 링크가 실제로 출력되는지 HTML에서 확인한다.
3. `metadata.applicationName`, `metadata.appleWebApp.title`, 매니페스트 `short_name`을 같은 문자열로 맞춘다. 홈 화면 아이콘 아래 표시되는 이름이다.
4. 설치 앱은 Safari와 저장소가 분리돼 있어 처음 실행하면 로그인이 필요하다. 첫 화면이 로그인으로 가는 흐름이 어색하지 않은지 확인한다.
5. `src/proxy.ts`의 세션 갱신이 standalone 환경에서도 동작하는지 확인한다.
6. 설치 후 앱 안에서 이동이 모두 앱 내부에서 처리되는지 확인한다. 외부 링크는 현재 없다.

검증:

- iOS: 공유 → 홈 화면에 추가 → 실행 시 주소창이 없다.
- Android: 메뉴 → 앱 설치가 노출된다.
- 설치 앱 이름이 "뭐했지"로 표시된다.
- 설치 앱에서 로그인 후 세션이 유지되고, 앱을 껐다 켜도 로그인 상태가 남는다.

## 4단계: 실기기 점검

1. iPhone(노치 또는 다이나믹 아일랜드) 1대, Android 1대에서 설치부터 기록 작성까지 한 바퀴 돈다.
2. 지도 화면이 새 하단 여백에서 잘리지 않는지 본다.
3. 큰 글씨 설정과 축소·확대에서 하단 탭이 깨지지 않는지 본다.
4. Lighthouse PWA 감사를 돌려 설치 가능 항목을 확인한다.

## 범위 제외

아래는 이번 전환에 넣지 않는다. 필요해지면 `future-features.md`로 옮겨 다시 판단한다.

- 서비스 워커와 오프라인 캐싱. Chrome은 108(모바일)·112(데스크톱)부터 서비스 워커 없이도 메뉴로 설치할 수 있다. 자동 설치 프롬프트를 띄우려면 fetch 핸들러가 필요하지만, 이번 목표는 설치 가능 자체다.
- 푸시 알림
- 앱 스토어 배포(TWA, Capacitor)
- 다크 모드 대응 아이콘과 테마 색

## 참고

- [Revisiting Chrome's installability criteria](https://developer.chrome.com/blog/update-install-criteria)
- [Making PWAs installable — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
