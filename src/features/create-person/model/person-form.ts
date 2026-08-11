export type CreatePersonActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldError?: string;
};

export const INITIAL_CREATE_PERSON_STATE: CreatePersonActionState = { status: "idle" };

export function validatePersonName(value: string): { name: string; error?: never } | { name?: never; error: string } {
  const name = value.trim();

  if (name.length < 1 || name.length > 50) {
    return { error: "이름은 1자 이상 50자 이하로 입력해 주세요." };
  }

  return { name };
}
