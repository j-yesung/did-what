import { MapPinnedIcon, NotebookPenIcon, PlusIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import styles from "./home-page.module.css";

const MAP_LEVELS = ["empty", "levelOne", "levelTwo", "levelThree", "levelFour"] as const;

function KoreaMapPreview() {
  return (
    <div className={styles.map} aria-label="대한민국 방문 기록 지도 미리보기">
      <div className={styles.mapTitle}>
        <span>나의 발자취</span>
        <strong>8개 지역</strong>
      </div>

      <svg className={styles.mapGraphic} viewBox="0 0 260 330" role="img" aria-labelledby="map-title map-description">
        <title id="map-title">대한민국 지도</title>
        <desc id="map-description">방문한 지역이 초록색 농도로 표시된 지도 미리보기</desc>
        <g className={styles.mapRegions} stroke="var(--surface)" strokeWidth="3" strokeLinejoin="round">
          <path className={styles.levelOne} d="M96 25 137 20 157 45 143 72 102 76 80 54Z" />
          <path className={styles.levelTwo} d="m80 57 23 20-7 44-39 9-25-30 15-31Z" />
          <path className={styles.levelThree} d="m104 77 39-3 19 38-23 28-44-18Z" />
          <path className={styles.empty} d="m163 48 24 17 11 66-34-18-19-40Z" />
          <path className={styles.levelOne} d="m57 132 39-9 20 38-24 33-49-12-13-28Z" />
          <path className={styles.levelFour} d="m98 123 42 18 2 48-50 4 24-32Z" />
          <path className={styles.levelTwo} d="m141 141 23-26 35 19 1 53-59 2Z" />
          <path className={styles.levelThree} d="m44 184 48 11 7 44-47 22-28-35Z" />
          <path className={styles.levelOne} d="m93 194 48-3 25 35-24 39-43-25Z" />
          <path className={styles.levelFour} d="m142 191 58-2-4 47-30-11Z" />
          <path className={styles.empty} d="m53 263 46-21 44 25-11 28-59 1Z" />
          <path className={styles.levelTwo} d="m143 267 23-39 29 10-14 48-48 9Z" />
          <path className={styles.levelThree} d="m81 306 49-4 25 9-21 11-50 1Z" />
          <path className={styles.levelOne} d="m31 290 16-7 12 8-13 9-16-3Z" />
        </g>
        <circle className={styles.mapPinHalo} cx="111" cy="174" r="15" />
        <circle className={styles.mapPin} cx="111" cy="174" r="5" />
      </svg>

      <div className={styles.mapLegend} aria-label="방문 기록 농도">
        <span>적게</span>
        <div className={styles.legendScale}>
          {MAP_LEVELS.map((level) => (
            <i className={styles[level]} key={level} />
          ))}
        </div>
        <span>많이</span>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>우리의 시간을 기억하는 지도</p>
          <h1>뭐했지</h1>
        </div>
        <Link className={styles.profileLink} href="/settings" aria-label="설정으로 이동">
          <Avatar size="lg">
            <AvatarFallback>나</AvatarFallback>
          </Avatar>
        </Link>
      </header>

      <section className={styles.intro} aria-labelledby="home-greeting">
        <p>2026년 8월 10일</p>
        <h2 id="home-greeting">
          함께한 순간들이
          <br />
          이만큼 쌓였어요.
        </h2>
      </section>

      <KoreaMapPreview />

      <section className={styles.summary} aria-label="발자취 요약">
        <div>
          <span>기록</span>
          <strong>24</strong>
          <small>개의 순간</small>
        </div>
        <Separator orientation="vertical" />
        <div>
          <span>방문 지역</span>
          <strong>8</strong>
          <small>곳의 발자취</small>
        </div>
      </section>

      <Button className="mt-5 h-14 w-full" size="lg" render={<Link href="/records/new" />} nativeButton={false}>
        <PlusIcon data-icon="inline-start" />새 기록 남기기
      </Button>

      <nav className={styles.navigation} aria-label="주요 메뉴">
        <Link className={styles.activeNavItem} href="/" aria-current="page">
          <MapPinnedIcon className={styles.navIcon} aria-hidden="true" />
          지도
        </Link>
        <Link href="/records">
          <NotebookPenIcon className={styles.navIcon} aria-hidden="true" />
          기록
        </Link>
        <Link href="/people">
          <UsersIcon className={styles.navIcon} aria-hidden="true" />
          사람
        </Link>
        <Link href="/settings">
          <SettingsIcon className={styles.navIcon} aria-hidden="true" />
          설정
        </Link>
      </nav>
    </main>
  );
}
