이 프로젝트의 UI 구현 전에 "뭐했지" 앱의 기본 컬러 시스템을 먼저 구성해줘.

"뭐했지"는 연인, 친구 등 함께한 사람과 언제, 어디서, 무엇을 했는지 기록하고 대한민국 지도 위에 발자취를 쌓아가는 모바일 PWA다.

연인 전용 앱처럼 핑크색이나 지나치게 귀여운 분위기는 피하고, 차분하고 자연스러운 라이프로그/지도 서비스의 느낌을 지향한다.

메인 브랜드 컬러는 Forest Green 계열을 사용한다.

### Brand palette

- 50: #F2F8F4
- 100: #E1F0E5
- 200: #C4E1CB
- 300: #98C9A5
- 400: #67AB78
- 500: #428C58
- 600: #327046
- 700: #295A3A
- 800: #244830
- 900: #1F3C29
- 950: #102219

Primary는 `#428C58`을 사용한다.

### Neutral / semantic colors

- background: #FAFAF8
- surface: #FFFFFF
- foreground: #1C1D1B
- muted: #F2F3EF
- muted-foreground: #73756F
- border: #E7E8E3

### 대한민국 지도 activity scale

향후 대한민국 지도를 GitHub Contributions처럼 방문/기록량에 따라 단계별로 표현할 예정이다.

- empty: #EBEDE8
- level-1: #D7EAD9
- level-2: #A8D1AE
- level-3: #69AC78
- level-4: #327046

현재 프로젝트의 Tailwind 및 globals.css 구성을 먼저 확인하고, 현재 사용 중인 Tailwind 버전에 맞는 방식으로 이 컬러 시스템을 구성해줘.

구현 원칙:

- 컴포넌트 내부에서 `green-500`, `gray-100` 같은 raw Tailwind color를 직접 사용하는 방식보다 semantic token을 우선한다.
- `primary`, `background`, `foreground`, `muted`, `muted-foreground`, `border` 등 역할 기반 token을 만든다.
- 지도 전용 색상은 `map-empty`, `map-level-1` ~ `map-level-4`처럼 별도로 구분한다.
- 향후 dark mode를 추가하기 쉽도록 구조화한다.
- 현재 프로젝트가 Tailwind CSS v4라면 v4 방식에 맞게 구현하고, 이전 버전이면 해당 버전에 맞게 구현한다.
- 불필요한 dependency는 추가하지 않는다.
- 아직 page.tsx UI는 구현하지 않는다.

작업 후 다음을 알려줘.

1. 수정한 파일
2. 추가한 semantic color token
3. Tailwind에서 각 token을 사용하는 방법
4. 이후 dark mode를 추가할 때 수정해야 할 위치
