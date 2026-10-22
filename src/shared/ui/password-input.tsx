"use client";

import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { IconButton } from "@/shared/ui/icon-button";
import { Input, type InputProps } from "@/shared/ui/input";

type PasswordInputProps = Omit<InputProps, "actionButton" | "type"> & {
  toggleLabel?: string;
};

export function PasswordInput({ toggleLabel = "비밀번호", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      actionButton={
        <IconButton
          aria-label={`${toggleLabel} ${visible ? "숨기기" : "표시"}`}
          icon={visible ? EyeSlashIcon : EyeIcon}
          iconSize={18}
          onClick={() => setVisible((current) => !current)}
          onMouseDown={(event) => event.preventDefault()}
          size="sm"
          type="button"
        />
      }
      type={visible ? "text" : "password"}
    />
  );
}
