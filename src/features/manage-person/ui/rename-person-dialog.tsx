"use client";

import { useActionState, useEffect, useState } from "react";

import { CircleAlertIcon, PencilIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/ui/alert";
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
import { INITIAL_PERSON_ACTION_STATE } from "../model/person-form";

type RenamePersonDialogProps = {
  name: string;
  personId: string;
};

export function RenamePersonDialog({ name, personId }: RenamePersonDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(renamePerson.bind(null, personId), INITIAL_PERSON_ACTION_STATE);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="flex-1" variant="outline" />}>
        <PencilIcon data-icon="inline-start" />
        이름 수정
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>이름 수정</DialogTitle>
          <DialogDescription>바뀐 이름은 기록 목록과 작성 폼에도 함께 반영돼요.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {state.status === "error" && state.message ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={Boolean(state.fieldError)}>
            <FieldLabel htmlFor="rename-person-name">이름</FieldLabel>
            <Input
              aria-describedby={state.fieldError ? "rename-person-name-error" : undefined}
              aria-invalid={Boolean(state.fieldError)}
              autoComplete="off"
              className="h-11"
              defaultValue={name}
              id="rename-person-name"
              maxLength={50}
              name="name"
              required
            />
            <FieldError id="rename-person-name-error">{state.fieldError}</FieldError>
          </Field>

          <DialogFooter>
            <DialogClose disabled={pending} render={<Button type="button" variant="outline" />}>
              취소
            </DialogClose>
            <Button loading={pending} type="submit">
              수정 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
