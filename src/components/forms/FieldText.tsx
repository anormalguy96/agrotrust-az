// agrotrust-az/src/components/forms/FieldText.tsx

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FieldTextSize = "sm" | "md" | "lg";

export type FieldTextProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;

  /**
   * Visual utilities
   */
  fieldSize?: FieldTextSize;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;

  /**
   * Optional adornments
   */
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;

  /**
   * If true, shows a small required mark next to label
   */
  showRequiredMark?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * FieldText
 *
 * A small form input with label + hint + error.
 * No external form library required.
 *
 * Expected global classes (can be refined in globals.css):
 * - .field
 * - .field__label
 * - .field__control
 * - .field__input
 * - .field__hint
 * - .field__error
 * - .field--error
 * - .field--sm/.field--md/.field--lg
 * - .field__adornment
 */
export const FieldText = forwardRef<HTMLInputElement, FieldTextProps>(
  (
    {
      label,
      hint,
      error,
      fieldSize = "md",
      containerClassName,
      labelClassName,
      inputClassName,
      startAdornment,
      endAdornment,
      showRequiredMark = false,
      id,
      required,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const inputId =
      id ?? (typeof label === "string" ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const hasError = Boolean(error);

    return (
      <div
        className={cx(
          "field",
          `field--${fieldSize}`,
          hasError && "field--error",
          disabled && "field--disabled",
          containerClassName
        )}
      >
        {label ? (
          <label
            className={cx("field__label", labelClassName)}
            htmlFor={inputId}
          >
            <span>{label}</span>
            {(required || showRequiredMark) && (
              <span className="field__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        ) : null}

        <div className={cx("field__control", className)}>
          {startAdornment ? (
            <span className="field__adornment field__adornment--start">
              {startAdornment}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              inputId
                ? [
                    hint ? `${inputId}-hint` : null,
                    error ? `${inputId}-error` : null
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                : undefined
            }
            className={cx("input", "field__input", inputClassName)}
            {...rest}
          />

          {endAdornment ? (
            <span className="field__adornment field__adornment--end">
              {endAdornment}
            </span>
          ) : null}
        </div>

        {hint && !error ? (
          <div
            id={inputId ? `${inputId}-hint` : undefined}
            className="field__hint"
          >
            {hint}
          </div>
        ) : null}

        {error ? (
          <div
            id={inputId ? `${inputId}-error` : undefined}
            className="field__error"
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </div>
    );
  }
);

FieldText.displayName = "FieldText";