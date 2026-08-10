import { MapIcon, NotebookPenIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import styles from "./home-page.module.css";
import { KoreaActivityMap } from "./korea-activity-map";

export function HomePage() {
  return (
    <main className={styles.shell}>
      <section className={styles.mapArea} aria-label="대한민국 활동 지도">
        <KoreaActivityMap />
      </section>

      <Button className="h-14 w-full shrink-0" size="lg" render={<Link href="/records/new" />} nativeButton={false}>
        <PlusIcon data-icon="inline-start" />새 기록 남기기
      </Button>

      <nav className={styles.navigation} aria-label="주요 메뉴">
        <Link className={styles.activeNavItem} href="/" aria-current="page">
          <MapIcon className={styles.navIcon} aria-hidden="true" />
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
      </nav>
    </main>
  );
}
