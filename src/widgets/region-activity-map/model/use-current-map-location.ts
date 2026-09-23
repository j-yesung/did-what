import { useState } from "react";

import { getKoreaMapPosition } from "@/entities/region";
import { showToast } from "@/shared/lib/toast";

type MapPosition = NonNullable<ReturnType<typeof getKoreaMapPosition>>;

export const useCurrentMapLocation = (onLocate: (position: MapPosition) => void) => {
  const [position, setPosition] = useState<MapPosition | null>(null);
  const [isPending, setIsPending] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      showToast({ title: "이 브라우저에서는 현재 위치를 확인할 수 없어요.", variant: "warning" });
      return;
    }

    setIsPending(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsPending(false);
        const position = getKoreaMapPosition(coords);
        if (!position) {
          setPosition(null);
          showToast({ title: "현재 위치가 대한민국 지도 범위 밖에 있어요.", variant: "warning" });
          return;
        }
        setPosition(position);
        onLocate(position);
      },
      (error) => {
        setIsPending(false);
        showToast({
          title:
            error.code === error.PERMISSION_DENIED
              ? "현재 위치를 보려면 브라우저 설정에서 위치 권한을 허용해 주세요."
              : error.code === error.TIMEOUT
                ? "위치를 확인하는 데 시간이 오래 걸려요. 다시 시도해 주세요."
                : "현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
          variant: "warning",
        });
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  return { position, isPending, locate };
};
