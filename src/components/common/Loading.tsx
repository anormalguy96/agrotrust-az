// agrotrust-az/src/components/common/Loading.tsx

import type { HTMLAttributes, ReactNode } from "react";

type LoadingSize = "sm" | "md" | "lg";
type LoadingVariant = "inline" | "block";

export type LoadingProps = HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
  size?: LoadingSize;
  variant?: LoadingVariant;
};

/**
 * Loading
 *
 * Minimal loading indicator aligned with the global utility approach.
 * Relies on these classes (you can define/extend them in globals.css):
 * - .loading
 * - .loading--inline / .loading--block
 * - .loading--sm / .loading--md / .loading--lg
 * - .loading__spinner
 * - .loading__label
 *
 * Even without extra CSS, this remains functional and accessible.
 */
export function Loading({
  label = "Loading…",
  size = "md",
  variant = "inline",
  className,
  ...rest
}: LoadingProps) {
  const classes = [
    "loading",
    `loading--${variant}`,
    `loading--${size}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...rest}
    >
      <span className="loading__spinner" aria-hidden="true" />
      {label ? <span className="loading__label">{label}</span> : null}
    </div>
  );
}