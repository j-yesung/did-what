# 뭐했지?

**함께한 사람과 장소를 중심으로 우리의 하루를 기록해요.**

뭐했지는 홈 화면에 설치해 앱처럼 쓰는 관계 기반 라이프로그 PWA(Progressive Web App)예요.
연인이나 친구와 언제, 어디서, 무엇을 했는지 기록하고 대한민국 지도와 타임라인으로 돌아봐요.
여행뿐 아니라 퇴근 후 산책, 단골 카페에서의 대화, 기념일처럼 함께한 일상도 모아 볼 수 있어요.

가입 없이 [체험 데모](https://did-what.vercel.app/demo)에서 샘플 데이터로 모든 기능을 직접 써 볼 수 있어요.

## 홈 화면에 설치해서 사용하기

뭐했지는 브라우저에서 바로 쓸 수 있고, 홈 화면에 설치하면 주소창 없이 독립된 앱 화면으로 실행돼요.

- **iPhone**: Safari에서 서비스를 열고 공유 메뉴의 ‘홈 화면에 추가’를 선택해요. [Apple 설치 안내](https://support.apple.com/ko-kr/guide/iphone/iph42ab2f3a7/ios)
- **Android·데스크톱**: 지원 브라우저의 ‘앱 설치’ 또는 ‘홈 화면에 추가’ 메뉴를 사용해요. [브라우저별 설치 안내](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)
- **기록 알림**: 지원 환경에서 알림 권한을 허용하고 설정의 ‘기록 알림’을 켜면 새 기록의 웹 푸시를 받을 수 있어요.

기록을 보고 저장하려면 인터넷 연결이 필요해요.

## 주요 기능

- **함께 쓰는 기록**: 한 계정에 구성원을 등록하고 기기마다 현재 사용자를 골라 그 이름으로 기록과 댓글을 남겨요.
- **기록 지도**: 대한민국 점 지도에서 다녀온 곳이 기록이 많을수록 밝게 빛나고, 지역을 고르면 그곳의 기록을 시·군·구별로 모아 봐요.
- **경로 보기**: 구성원의 집에서 그날 다녀온 곳까지 카카오 길찾기 경로를 그리고, 방문한 장소까지 차례로 이으며 거리와 시간도 함께 보여 줘요.
- **나의 집 주소**: 경로의 출발지가 되는 집 주소를 구성원마다 등록해요.
- **타임라인과 달력**: 기록을 날짜순이나 월별로 돌아보고 검색·카테고리·기간으로 찾아요.
- **하루 기록하기**: 언제 → 어디서 → 무엇을 순서로 날짜·날씨, 방문 지역·장소, 카테고리·제목·메모를 남겨요.
- **장소 모아 보기**: 저장한 장소와 그곳에 쌓인 기록을 모아 보고, 카카오 장소 검색으로 새 장소를 저장해요.
- **화면 모드**: 라이트·다크·시스템 모드를 지원해요.

## 실제 화면

모두 체험 데모에서 찍은 화면이고, 등장하는 사람과 기록은 가상 데이터예요. 데모의 경로는 길찾기 대신 직선으로 이어요.

### 지도와 시간으로 돌아보기

다녀온 곳이 빛나는 지도와 타임라인, 달력에서 함께한 날들을 다시 찾아봐요.

[![다녀온 곳이 빛나는 대한민국 점 지도, 날짜순 기록 타임라인, 월별 달력과 선택한 날의 기록](docs/images/overview-flow.png)](docs/images/overview-flow.png)

### 그날의 경로 따라가기

집에서 그날 다녀온 곳까지, 그리고 방문한 장소 사이를 차례로 이어 그려요.

[![경로 보기 버튼이 있는 부산 여행 기록 상세, 집에서 부산까지 이어진 경로와 거리·시간, 해운대와 광안리를 차례로 이은 경로](docs/images/route-flow.png)](docs/images/route-flow.png)

### 기록 작성: 언제 → 어디서 → 무엇을

날짜와 날씨, 방문한 지역과 장소, 카테고리·제목·메모를 차례로 남겨요.

[![날짜와 날씨 선택, 방문 지역과 장소 선택, 카테고리와 제목 및 메모 입력을 순서대로 이어 붙인 실제 화면](docs/images/record-create-flow.png)](docs/images/record-create-flow.png)

### 그날의 이야기와 댓글

지도에서 바로 기록을 열어 보고 구성원 이름으로 댓글을 주고받아요.

[![지도 위 시트로 연 피크닉 기록 상세, 기록 상세 화면, 구성원의 댓글과 작성 중인 댓글](docs/images/record-detail-flow.png)](docs/images/record-detail-flow.png)

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 웹 | Next.js App Router, React, TypeScript |
| 스타일·UI | Tailwind CSS, shadcn/ui, Base UI, Phosphor Icons |
| 서버 상태 | TanStack Query |
| 인증·데이터 | Supabase Auth, PostgreSQL, RLS |
| 장소·지역 검색 | Kakao Local API |
| 경로·주소 | Kakao Mobility 길찾기 API, 카카오 우편번호 서비스 |
| 인터랙션 | Motion, use-funnel |
| PWA | Web App Manifest, Service Worker, Web Push |
| 도구 | pnpm, Biome, Node.js 내장 테스트 러너 |

## 로컬 실행

프로젝트의 패키지 관리자는 `pnpm@11.21.0`이에요.
이 pnpm 버전을 지원하는 Node.js 환경과 Supabase 프로젝트, 카카오 REST API 키가 필요해요.

```sh
pnpm install
```

루트에 `.env.local`을 만들고 연결할 프로젝트의 값을 넣어요.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
```

웹 푸시를 쓰려면 다음 값도 설정해요.

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:YOUR_EMAIL
```

새 Supabase 프로젝트의 스키마 준비와 마이그레이션 절차는 [DB 마이그레이션 안내](supabase/README.md)를 참고해요.
이메일 인증을 쓴다면 `http://localhost:3000/auth/confirm`을 Supabase의 허용 리디렉션 URL에 등록해요.

```sh
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 회원가입해요.
이메일 인증이 켜져 있다면 인증 메일의 링크로 가입을 마친 뒤 구성원을 등록하면 기록을 시작할 수 있어요.

로그인 없이 화면을 살펴보려면 [http://localhost:3000/demo](http://localhost:3000/demo)를 열어요.
데모는 실제 앱 컴포넌트를 샘플 데이터로 실행하고, 데모에서 바꾼 내용은 실제 서비스에 저장되지 않아요.

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

Feature-Sliced Design의 레이어별 의존 방향을 따르고, 상세 규칙은 [코드 컨벤션](docs/guides/convention.md)에 정리되어 있어요.

## 개발 문서

- [코드 컨벤션](docs/guides/convention.md)
- [변경 범위별 검증 가이드](docs/guides/verification.md)
- [DB 마이그레이션 안내](supabase/README.md)
