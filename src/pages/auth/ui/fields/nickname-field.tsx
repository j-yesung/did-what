import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type NicknameFieldProps = {
  error?: string;
};

export function NicknameField({ error }: NicknameFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="displayName">닉네임</FieldLabel>
      <Input
        className="h-11"
        id="displayName"
        name="displayName"
        type="text"
        autoComplete="name"
        minLength={1}
        maxLength={100}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "displayName-error" : undefined}
        placeholder="닉네임을 입력해 주세요"
        variant="underline"
      />
      <FieldError id="displayName-error">{error}</FieldError>
    </Field>
  );
}
