"use client";

import { type FormEvent, useState } from "react";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { renamePerson } from "../model/actions";

type RenamePersonDialogProps = {
  name: string;
  personId: string;
};

export function RenamePersonDialog({ name, personId }: RenamePersonDialogProps) {
  const [open, setOpen] = useState(false);
  const rename = useActionMutation((formData: FormData) => renamePerson(personId, formData), {
    error: "이름을 바꾸지 못했어요",
    onSuccess: () => setOpen(false),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    rename.mutate(new FormData(event.currentTarget));
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="flex-1" variant="outline" />}>이름 수정</DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>이름 수정</DialogTitle>
          <DialogDescription>바뀐 이름은 기록 목록과 작성 폼에도 함께 반영돼요.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field data-invalid={Boolean(rename.data?.fieldError)}>
            <FieldLabel htmlFor="rename-person-name">이름</FieldLabel>
            <Input
              aria-describedby={rename.data?.fieldError ? "rename-person-name-error" : undefined}
              aria-invalid={Boolean(rename.data?.fieldError)}
              autoComplete="off"
              className="h-11"
              defaultValue={name}
              id="rename-person-name"
              maxLength={50}
              name="name"
              required
            />
            <FieldError id="rename-person-name-error">{rename.data?.fieldError}</FieldError>
          </Field>

          <DialogFooter>
            <DialogClose disabled={rename.isPending} render={<Button type="button" variant="outline" />}>
              취소
            </DialogClose>
            <Button loading={rename.isPending} type="submit">
              확인
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
