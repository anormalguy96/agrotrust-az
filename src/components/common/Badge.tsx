// agrotrust-az/src/components/common/Badge.tsx

import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "muted"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "outline";

type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Badge
 *
 * A small label component aligned with the global utility approach:
 * `.badge`, plus variant/size modifiers.
 *
 * If you later decide to centralise styles, you only need to keep these
 * class names consistent with globals.css.
 */
export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  const classes = cx(
    "badge",
    variant && `badge--${variant}`,
    size && `badge--${size}`,
    className
  );

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

export type { BadgeVariant, BadgeSize };
