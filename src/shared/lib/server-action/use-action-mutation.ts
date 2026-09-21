"use client";

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";

import { showToast } from "@/shared/lib/toast";

import { runServerAction } from "./run-server-action";

type ActionResult = { message?: string; status?: "idle" | "error" | "success" };

type ActionMutationOptions<TResult> = {
  error: string;
  invalidate?: readonly QueryKey[];
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
export const useActionMutation = <TResult extends ActionResult, TArgs = void>(
  action: (args: TArgs) => Promise<TResult>,
  { error, invalidate = [], success, onFail, onSuccess }: ActionMutationOptions<TResult>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: TArgs) => runServerAction(() => action(args)),
    onSuccess: async (result) => {
      if (result?.status === "error") {
        if (result.message) showToast({ description: result.message, title: error, variant: "warning" });
        onFail?.(result);
        return;
      }

      const title = success ?? result?.message;
      if (title) showToast({ title, variant: "success" });
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onSuccess?.(result);
    },
    onError: () => showToast({ title: error, variant: "error" }),
  });
};
