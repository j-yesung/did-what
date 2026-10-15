# 뭐했지?

**함께한 사람과 장소를 중심으로 우리의 하루를 기록합니다.**

뭐했지는 홈 화면에 설치해 앱처럼 사용하는 관계 기반 라이프로그 PWA(Progressive Web App)입니다.
연인이나 친구와 언제, 어디서, 무엇을 했는지 기록하고 대한민국 지도와 타임라인으로 돌아봅니다.
여행뿐 아니라 퇴근 후 산책, 단골 카페에서의 대화, 기념일처럼 함께한 일상도 모아 볼 수 있습니다.

## 홈 화면에 설치해서 사용하기

뭐했지는 브라우저에서 바로 사용할 수 있고 홈 화면에 설치하면 주소창 없이 독립된 앱 화면으로 실행됩니다.

- **iPhone**: Safari에서 서비스를 열고 공유 메뉴의 ‘홈 화면에 추가’를 선택합니다. [Apple 설치 안내](https://support.apple.com/ko-kr/guide/iphone/iph42ab2f3a7/ios)
- **Android·데스크톱**: 지원 브라우저의 ‘앱 설치’ 또는 ‘홈 화면에 추가’ 메뉴를 사용합니다. [브라우저별 설치 안내](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)
- **기록 알림**: 지원 환경에서 알림 권한을 허용하고 설정의 ‘기록 알림’을 켜면 새 기록의 웹 푸시를 받을 수 있습니다.

현재 기록 조회와 저장에는 인터넷 연결이 필요합니다.

## 주요 기능

- **함께 쓰는 기록**: 한 계정에 구성원을 등록하고 기기마다 현재 사용자를 선택합니다.
  설정의 전환 시트에서 아바타와 이름을 누르면 바로 바뀌며, 선택한 구성원 이름으로 댓글을 남깁니다.
- **홈 활동 지도**: 큰 대한민국 셀 지도에서 방문한 지역을 한눈에 확인합니다.
  지도 아래 3열 미니 지역 지도를 누르면 해당 지역의 기록 시트가 열립니다.
  `방문 | 전체` 세그먼트로 지역 목록을 바꾸고, 화면에 고정된 현재 위치 버튼으로 지도에 내 위치를 표시합니다.
- **지역별 기록**: 지역 시트에서 시·군·구별로 기록을 좁혀 보고, 기록을 누르면 시트 안에서 상세와 댓글을 확인합니다.
  아래로 스와이프하면 시트가 닫힙니다.
- **타임라인과 달력**: 좌우 타임라인 또는 월별 달력으로 기록을 돌아보고 활동·메모·지역과 카테고리로 찾습니다.
  필터 시트에서는 첫날과 마지막 날을 각각 지정하고 최신순·오래된순을 고릅니다.
  초기화는 시트의 선택만 지우며, ‘적용’을 눌러야 목록에 반영됩니다.
- **하루 기록하기**: 언제 → 어디서 → 무엇을 순서로 날짜·날씨, 지역·장소, 카테고리·활동·메모를 남깁니다.
  장소는 하나의 시트에서 `내 장소 | 검색`을 오가며 고르고, 탭을 바꿔도 선택을 유지합니다.
- **장소 모아 보기**: 저장한 장소를 4열 그리드로 보고 이름이나 주소로 바로 검색합니다.
  ‘새 장소 찾기’ 시트에서는 카카오 장소 검색으로 장소를 찾아 저장합니다.
  장소 상세에는 그곳의 기록이 타임라인으로 모이며, 상단 리퀴드 글래스 기록 버튼을 누르면 해당 장소를 미리 담아 기록을 시작합니다.
- **사용 환경**: 라이트·다크·시스템 테마, PWA 설치, 새 기록 알림과 웹 푸시를 지원합니다.

## 실제 화면

로컬 앱을 모바일 화면 크기(390 x 844)로 실행해 캡처했습니다.
화면 속 구성원 이름, 방문 날짜, 활동, 메모와 댓글은 가상 데이터입니다.
최근 변경한 화면은 실제 앱과 컴포넌트를 공유하는 체험 데모로 촬영했으며, 데모의 장소 검색 결과도 샘플 데이터입니다.

핵심 사용 흐름을 합친 이미지 6개로 소개합니다.
각 이미지는 실제 화면 3장으로 구성되어 있으며 클릭하면 원본 크기로 볼 수 있습니다.
선택 시트와 관리 화면 등 추가 캡처는 아래 상세 목록에서 확인할 수 있습니다.

### 지도와 시간으로 돌아보기

대한민국 활동 지도에서 발자취를 보고 타임라인과 달력에서 함께한 날들을 다시 찾아봅니다.
홈의 지역 목록은 3열 미니 지도로 배치되어 있으며, 방문한 지역만 보거나 전체 지역을 펼칠 수 있습니다.

[![대한민국 활동 지도, 날짜순 기록 타임라인, 월별 달력과 선택한 날의 기록 목록을 이어 붙인 실제 화면](docs/images/overview-flow.png)](docs/images/overview-flow.png)

### 지역별 기억 펼쳐 보기

큰 대한민국 지도 아래에서 지역별 미니 지도를 3열로 확인합니다.
`방문 | 전체`로 표시 범위를 바꾸고 원하는 지역을 한 번 눌러 기록 시트를 엽니다.
지역 시트에서는 시·군·구로 기록을 좁혀 보거나 아래로 스와이프해 홈으로 돌아갑니다.

[![큰 대한민국 지도, 방문 지역을 3열로 보여 주는 미니 지도 목록, 서울의 지역별 기록 시트](docs/images/map-flow.png)](docs/images/map-flow.png)

### 기록 작성: 언제 → 어디서 → 무엇을

날짜와 날씨를 고르고 방문한 지역과 장소를 담은 뒤 카테고리·활동·메모를 입력합니다.
장소 추가 시트의 `내 장소 | 검색`에서 저장 장소와 새 장소를 함께 선택합니다.

[![날짜와 날씨 선택, 방문 지역과 장소 선택, 카테고리와 활동 및 메모 입력을 순서대로 이어 붙인 실제 화면](docs/images/record-create-flow.png)](docs/images/record-create-flow.png)

### 그날의 이야기와 댓글

홈의 미니 지역 지도를 눌러 지역 시트를 열고, 시·군·구별 기록에서 상세로 이어집니다.
날짜·날씨·장소·메모를 돌아보고 구성원 이름으로 댓글을 주고받습니다.

[![서울의 지역 기록 시트, 시트 안의 피크닉 기록 상세, 구성원의 댓글과 댓글 입력창](docs/images/record-detail-flow.png)](docs/images/record-detail-flow.png)

### 이 기기의 사용자 전환하기

설정의 ‘전환’을 누르면 아바타·이름·현재 사용자 체크 표시가 있는 선택 시트가 열립니다.
다른 구성원을 한 번 누르면 바로 전환되고 완료 안내가 표시됩니다.

[![아바타가 있는 현재 사용자 행, 세로 목록의 사용자 전환 시트, 전환 후 설정과 완료 안내](docs/images/member-switch-flow.png)](docs/images/member-switch-flow.png)

### 장소에 쌓인 추억

저장한 장소를 4열 그리드에서 찾고, 장소 상세의 타임라인에서 함께한 날들을 모아 봅니다.
상단 기록 버튼을 누르면 그 장소가 미리 담깁니다. 새 장소 검색과 저장은 별도 시트에서 진행합니다.

[![저장한 장소 4열 그리드, 망원 한강공원의 기록 타임라인, 별도 시트의 새 장소 검색과 저장](docs/images/place-flow.png)](docs/images/place-flow.png)

<details>
<summary>추가 화면 보기 — 가입, 선택 시트, 수정·삭제, 설정</summary>

아래 링크를 누르면 각 흐름의 실제 화면 3장을 볼 수 있습니다.

- [회원가입 · 로그인 · 구성원 최초 설정](docs/images/auth-flow.png)
- [지역 검색 시트 · 내 장소 선택 · 새 장소 검색과 선택 유지](docs/images/record-picker-flow.png)
- [기간·정렬 필터 시트 · 날짜별 기록 목록 · 지역 시트 안의 기록 상세](docs/images/record-browse-flow.png)
- [기록 관리 시트 · 기록 수정 화면 위·아래](docs/images/record-manage-flow.png)
- [새 장소 찾기 시트와 저장 · 장소 관리 시트 · 장소 삭제 확인](docs/images/place-manage-flow.png)
- [현재 사용자 아바타가 있는 다크 모드 설정 · 구성원별 알림 · 로그아웃 확인](docs/images/settings-flow.png)
- [기록 삭제 확인 · 댓글 삭제 확인 · 빈 검색 결과](docs/images/record-state-flow.png)

</details>

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 웹 | Next.js App Router, React, TypeScript |
| 스타일·UI | Tailwind CSS, shadcn/ui, Base UI, Phosphor Icons |
| 서버 상태 | TanStack Query |
| 인증·데이터 | Supabase Auth, PostgreSQL, RLS |
| 장소·지역 검색 | Kakao Local API |
| 인터랙션 | Motion, use-funnel |
| PWA | Web App Manifest, Service Worker, Web Push |
| 도구 | pnpm, Biome, Node.js 내장 테스트 러너 |

## 로컬 실행

프로젝트의 패키지 관리자는 `pnpm@11.21.0`입니다.
해당 pnpm 버전을 지원하는 Node.js 환경과 Supabase 프로젝트, 카카오 REST API 키가 필요합니다.

```sh
pnpm install
```

루트에 `.env.local`을 만들고 연결할 프로젝트의 값을 입력합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
```

웹 푸시를 사용하려면 다음 값도 설정합니다.

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:YOUR_EMAIL
```

새 Supabase 프로젝트의 스키마 준비와 마이그레이션 절차는 [DB 마이그레이션 안내](supabase/README.md)를 따릅니다.
이메일 인증을 사용하는 경우 `http://localhost:3000/auth/confirm`을 Supabase의 허용 리디렉션 URL에 등록합니다.
다른 포트로 실행한다면 실제 실행 주소에 맞춰 등록합니다.

```sh
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 회원가입합니다.
이메일 인증이 켜져 있다면 인증 메일의 링크로 가입을 완료한 뒤 구성원을 등록하면 기록을 시작할 수 있습니다.

로그인 없이 화면을 살펴보려면 로컬 서버 실행 후 [체험 데모](http://localhost:3000/demo)를 엽니다.
실제 앱의 컴포넌트를 샘플 데이터로 구동하며, 데모에서 기록·장소·사용자를 바꿔도 실제 서비스에는 저장되지 않습니다.

## 프로젝트 구조

```text
app/             Next.js 라우팅과 route handler 진입점
src/app/         전역 스타일, provider, route handler 구현
src/pages/       페이지 단위 화면 조합
src/widgets/     지도, 기록 폼 등 화면 블록
src/features/    회원가입, 기록 생성, 장소 선택 등 사용자 행동
src/entities/    기록, 장소, 지역, 구성원 등 도메인
src/shared/      공용 UI, API 클라이언트, 유틸
demo/            실제 앱 컴포넌트와 샘플 데이터를 연결하는 체험 데모
docs/            개발 문서, 기획과 백로그, README 스크린샷
supabase/        데이터베이스 마이그레이션
public/          PWA 아이콘, 서비스 워커 등 정적 파일
```

Feature-Sliced Design의 레이어별 의존 방향을 따릅니다.
상세 규칙은 [코드 컨벤션](docs/guides/convention.md)에 정리되어 있습니다.

## 개발 문서

- [코드 컨벤션](docs/guides/convention.md)
- [변경 범위별 검증 가이드](docs/guides/verification.md)
- [DB 마이그레이션 안내](supabase/README.md)
- [추후 기능과 백로그](docs/planning/future-features.md)
