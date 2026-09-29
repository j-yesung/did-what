import { Spinner } from "./spinner";
import { TextButton } from "./text-button";

type Props = {
  error?: string;
  label?: string;
  loading: boolean;
  onClick: () => void;
};

export function LoadMoreButton({ error, label = "더 보기", loading, onClick }: Props) {
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-2 py-6">
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <TextButton
        aria-busy={loading || undefined}
        aria-label={loading ? "더 불러오는 중" : undefined}
        disabled={loading}
        onClick={onClick}
        type="button"
      >
        {loading ? <Spinner aria-hidden="true" /> : error ? "다시 시도" : label}
      </TextButton>
    </div>
  );
}
