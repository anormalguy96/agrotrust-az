// agrotrust-az/src/components/forms/FieldDate.tsx

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FieldDateSize = "sm" | "md" | "lg";
type FieldDateType = "date" | "datetime-local" | "month" | "week";

export type FieldDateProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;

  /**
   * Visual utilities
   */
  fieldSize?: FieldDateSize;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;

  /**
   * Date input flavour
   */
  type?: FieldDateType;

  /**
   * If true, shows a small required mark next to label
   */
  showRequiredMark?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * FieldDate
 *
 * Date input with label + hint + error.
 * Keeps the same API and class strategy as FieldText/FieldSelect.
 *
 * Expected global classes:
 * - .field, .field__label, .field__control, .field__input
 * - .field__hint, .field__error, .field--error, .field--disabled
 * - .field--sm/.field--md/.field--lg
 * - .input (base input styling)
 */
export const FieldDate = forwardRef<HTMLInputElement, FieldDateProps>(
  (
    {
      label,
      hint,
      error,
      fieldSize = "md",
      containerClassName,
      labelClassName,
      inputClassName,
      showRequiredMark = false,
      id,
      required,
      disabled,
      className,
      type = "date",
      ...rest
    },
    ref
  ) => {
    const inputId =
      id ??
      (typeof label === "string"
        ? `field-${label.toLowerCase().replace(/\s+/g, "-")}`
        : undefined);

    const hasError = Boolean(error);

    const describedBy =
      inputId
        ? [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        : undefined;

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
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cx("input", "field__input", inputClassName)}
            {...rest}
          />
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

FieldDate.displayName = "FieldDate";