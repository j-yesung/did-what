/** 서버 액션의 결과. 사용자가 고칠 수 있는 실패는 예외 대신 error 상태와 문구로 돌려준다. */
export type ActionState<T = unknown> = T & {
  message?: string;
  status: "error" | "success";
};
