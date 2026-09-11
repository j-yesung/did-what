import axios from "axios";

const DEFAULT_ERROR_MESSAGE = "요청을 처리하지 못했어요.\n잠시 후 다시 시도해 주세요.";

/**
 * 화면이 Axios나 Supabase의 오류 구조를 직접 뒤지지 않도록 한곳에서 문구를 만든다.
 * Route Handler는 실패할 때 { error: string } 형태로 사용자에게 보여줄 문구를 내려준다.
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;

    return typeof message === "string" && message ? message : DEFAULT_ERROR_MESSAGE;
  }

  return DEFAULT_ERROR_MESSAGE;
};
