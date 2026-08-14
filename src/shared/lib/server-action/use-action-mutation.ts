"use client";

import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/shared/ui/toast";

import { runServerAction } from "./run-server-action";

type ActionResult = { message?: string; status?: "idle" | "error" | "success" };

type ActionMutationOptions<TResult> = {
  error: string;
  success?: string;
  onSuccess?: (result: TResult | undefined) => void;
  onFail?: (result: TResult) => void;
};

/**
 * 서버 액션을 mutation으로 감싸고 결과 토스트까지 한곳에서 처리한다.
 *
 * 서버 액션은 두 가지로 실패한다. 사용자가 고칠 수 있는 입력 오류는 error 상태로 돌아오고,
 * 요청 자체가 실패하면 예외로 터진다. 앞의 것은 액션의 message를, 뒤의 것은 넘겨받은 제목만 보여준다.
 */
export function useActionMutation<TResult extends ActionResult, TArgs = void>(
  action: (args: TArgs) => Promise<TResult>,
  { error, success, onFail, onSuccess }: ActionMutationOptions<TResult>,
) {
  const { add: addToast } = useToast();

  return useMutation({
    mutationFn: (args: TArgs) => runServerAction(() => action(args)),
    onSuccess: (result) => {
      if (result?.status === "error") {
        if (result.message) addToast({ description: result.message, title: error, type: "error" });
        onFail?.(result);
        return;
      }

      const title = success ?? result?.message;
      if (title) addToast({ title, type: "success" });
      onSuccess?.(result);
    },
    onError: () => addToast({ title: error, type: "error" }),
  });
}
