"use client";

import { useRef, useState } from "react";

import { PlusIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { TextButton } from "@/shared/ui/text-button";

import { setupMembers } from "../api/setup-members";
import { MIN_MEMBER_COUNT } from "../model/member-setup";

export function MemberSetupForm() {
  const [members, setMembers] = useState([
    { id: 0, name: "" },
    { id: 1, name: "" },
  ]);
  const [selectedId, setSelectedId] = useState(0);
  const nextId = useRef(2);
  const submit = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = await getPushEndpoint().catch(() => null);
      if (endpoint) formData.set("endpoint", endpoint);
      return runServerAction(() => setupMembers(formData));
    },
  });

  const removeMember = (id: number) => {
    const next = members.filter((member) => member.id !== id);
    if (selectedId === id) setSelectedId(next[0].id);
    setMembers(next);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate(new FormData(event.currentTarget));
      }}
    >
      <FieldGroup className="gap-7">
        {submit.data?.message || submit.isError ? (
          <Alert variant="destructive">
            <WarningCircleIcon aria-hidden="true" strokeWidth={2} />
            <AlertTitle>확인해 주세요</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
              {submit.data?.message ?? "구성원을 등록하지 못했습니다.\n잠시 후 다시 시도해 주세요."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div aria-label="이 기기에서 사용할 사람" className="flex flex-col gap-5" role="radiogroup">
          {members.map((member, index) => (
            <Field className="gap-3" key={member.id}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FieldLabel htmlFor={`member-${index}`}>{index + 1}번째 사람</FieldLabel>
                  <Input
                    autoComplete="name"
                    className="mt-2 h-11"
                    id={`member-${index}`}
                    maxLength={100}
                    name="memberName"
                    onChange={(event) =>
                      setMembers((current) =>
                        current.map((candidate) =>
                          candidate.id === member.id ? { ...candidate, name: event.target.value } : candidate,
                        ),
                      )
                    }
                    placeholder="이름"
                    required
                    value={member.name}
                  />
                </div>
                {members.length > MIN_MEMBER_COUNT ? (
                  <Button
                    aria-label={`${index + 1}번째 사람 삭제`}
                    color="danger"
                    onClick={() => removeMember(member.id)}
                    size="medium"
                    type="button"
                    variant="weak"
                  >
                    <TrashIcon aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
              <Button
                aria-checked={selectedId === member.id}
                className={cn(
                  "min-h-11 justify-between",
                  selectedId === member.id && "border-primary bg-primary/10 text-primary",
                )}
                fullWidth
                onClick={() => setSelectedId(member.id)}
                role="radio"
                size="field"
                type="button"
                variant="outline"
              >
                {selectedId === member.id ? "현재 사용자" : "이 사람을 현재 사용자로 선택"}
                <span
                  aria-hidden="true"
                  className="flex size-4 items-center justify-center rounded-full border border-current"
                >
                  {selectedId === member.id ? <span className="size-2 rounded-full bg-current" /> : null}
                </span>
              </Button>
            </Field>
          ))}
        </div>

        <input
          name="currentMemberIndex"
          type="hidden"
          value={members.findIndex((member) => member.id === selectedId)}
        />

        <Field>
          <TextButton
            className="self-start"
            onClick={() => {
              const id = nextId.current;
              nextId.current += 1;
              setMembers((current) => [...current, { id, name: "" }]);
            }}
            tone="brand"
            type="button"
          >
            <PlusIcon aria-hidden="true" /> 사람 추가
          </TextButton>
          <FieldDescription>한 번 등록하면 다른 기기에서는 이름을 다시 입력하지 않아도 돼요.</FieldDescription>
        </Field>

        <Button fullWidth loading={submit.isPending} size="large" type="submit">
          시작하기
        </Button>
      </FieldGroup>
    </form>
  );
}
