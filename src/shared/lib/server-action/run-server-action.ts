/**
 * 서버 액션이 redirect()로 끝나면 프레임워크가 화면 이동을 처리한 뒤 NEXT_REDIRECT 오류를 던진다.
 * 실패가 아니라 성공의 다른 모습이라, mutation이 이걸 오류로 받지 않도록 여기서 걸러 낸다.
 * 이동 자체는 이 함수와 무관하게 프레임워크가 이미 수행한다.
 */
export async function runServerAction<T>(action: () => Promise<T>): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return undefined;
    }

    throw error;
  }
}
