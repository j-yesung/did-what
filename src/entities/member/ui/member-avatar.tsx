import { cn } from "@/shared/lib/utils";

import { getMemberAvatarTone, getMemberInitial } from "../model/member-avatar";

type MemberAvatarProps = {
  className?: string;
  memberId: string;
  name: string;
};

/** 이름이 늘 옆에 함께 나오므로 보조기기에는 숨긴다. */
export function MemberAvatar({ className, memberId, name }: MemberAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 select-none items-center justify-center rounded-full font-semibold text-sm",
        getMemberAvatarTone(memberId),
        className,
      )}
    >
      {getMemberInitial(name)}
    </span>
  );
}
