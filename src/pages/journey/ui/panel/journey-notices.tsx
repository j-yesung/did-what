import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";

import styles from "../journey-map.module.css";

export function EmptyJourney() {
  return (
    <div className={styles.empty}>
      <h2>함께한 곳을 남겨볼까요?</h2>
      <p>
        장소가 담긴 기록이 쌓이면
        <br />
        여기서 다시 돌아볼 수 있어요.
      </p>
      <Button nativeButton={false} render={<PressLink href="/records/new" />} size="large">
        기록 남기기
      </Button>
    </div>
  );
}

export function HomeLoadError() {
  const router = useRouter();
  return <LoadErrorAlert title="집 주소를 불러오지 못했어요." onRetry={() => router.refresh()} />;
}

export function HomeNotice({ unavailable, onRegister }: { unavailable: boolean; onRegister: () => void }) {
  return (
    <div className={styles.homeNotice}>
      {unavailable ? (
        <HomeLoadError />
      ) : (
        <>
          <p>길을 따라가려면 집 주소를 등록해 주세요.</p>
          <Button className={styles.hit} color="dark" onClick={onRegister} size="medium" variant="weak">
            등록하기
          </Button>
        </>
      )}
    </div>
  );
}
