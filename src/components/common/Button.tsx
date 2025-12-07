// agrotrust-az/src/components/common/Button.tsx

import type {
  ButtonHTMLAttributes,
  ReactNode
} from "react";
import { NavLink } from "react-router-dom";
import type { NavLinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "ghost" | "soft" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
  };

type ButtonAsLinkProps = CommonProps &
  Omit<NavLinkProps, "className"> & {
    to: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
  loading?: boolean
) {
  return cx(
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    loading && "btn--loading",
    className
  );
}

/**
 * Button
 *
 * Router-aware button:
 * - If `to` is provided, renders a NavLink.
 * - Otherwise renders a native button.
 */
export function Button(props: ButtonProps) {
  // Link mode
  if ("to" in props && typeof props.to === "string") {
    const {
      to,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      ...linkRest
    } = props;

    const classes = buildClassName(variant, size, className, loading);

    return (
      <NavLink
        to={to}
        className={classes}
        aria-busy={loading || undefined}
        {...linkRest}
      >
        {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        <span className="btn__label">{children}</span>
        {rightIcon && (
          <span className="btn__icon btn__icon--right">{rightIcon}</span>
        )}
      </NavLink>
    );
  }

  // Button mode
  const {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    ...buttonRest
  } = props as ButtonAsButtonProps;

  const classes = buildClassName(variant, size, className, loading);

  return (
    <button
      type={buttonRest.type ?? "button"}
      disabled={loading || buttonRest.disabled}
      className={classes}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
      <span className="btn__label">{children}</span>
      {rightIcon && (
        <span className="btn__icon btn__icon--right">{rightIcon}</span>
      )}
    </button>
  );
}

export type { ButtonVariant, ButtonSize };