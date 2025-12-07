// agrotrust-az/src/components/common/Card.tsx

import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "soft";

/**
 * Card
 *
 * Lightweight wrapper over the global `.card` utility class.
 * Use `variant="soft"` to apply the `.card--soft` modifier.
 *
 * This component is intentionally minimal for the hackathon MVP.
 */
export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  children?: ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  variant = "default",
  className,
  children,
  ...rest
}: CardProps) {
  const classes = cx(
    "card",
    variant === "soft" && "card--soft",
    className
  );

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}