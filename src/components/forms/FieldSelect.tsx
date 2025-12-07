// agrotrust-az/src/components/forms/FieldSelect.tsx

import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type FieldSelectSize = "sm" | "md" | "lg";

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type FieldSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;

  /**
   * Visual utilities
   */
  fieldSize?: FieldSelectSize;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;

  /**
   * Data
   */
  options?: SelectOption[];
  placeholder?: ReactNode;

  /**
   * If true, shows a small required mark next to label
   */
  showRequiredMark?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * FieldSelect
 *
 * Simple select field with label + hint + error.
 * Works with or without provided `options`.
 *
 * Expected global classes:
 * - .field, .field--error, .field--disabled, .field--sm/.field--md/.field--lg
 * - .field__label, .field__control, .field__hint, .field__error
 * - .input (base input styling)
 */
export const FieldSelect = forwardRef<HTMLSelectElement, FieldSelectProps>(
  (
    {
      label,
      hint,
      error,
      fieldSize = "md",
      containerClassName,
      labelClassName,
      selectClassName,
      options,
      placeholder = "Select an option",
      showRequiredMark = false,
      id,
      required,
      disabled,
      className,
      children,
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
          <select
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cx("input", "field__select", selectClassName)}
            {...rest}
          >
            {/* Placeholder option (only meaningful when no value selected) */}
            {placeholder != null && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}

            {options?.map((opt) => (
              <option
                key={String(opt.value)}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label as any}
              </option>
            ))}

            {/* Allow manual children override/extension */}
            {children}
          </select>
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

FieldSelect.displayName = "FieldSelect";