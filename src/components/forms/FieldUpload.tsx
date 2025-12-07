// agrotrust-az/src/components/forms/FieldUpload.tsx

import { forwardRef, useId, useMemo, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/common/Button";

type FieldUploadSize = "sm" | "md" | "lg";

export type FieldUploadProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "value"
> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;

  /**
   * Visual utilities
   */
  fieldSize?: FieldUploadSize;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;

  /**
   * Upload UX
   */
  placeholder?: ReactNode;
  buttonText?: ReactNode;
  showRequiredMark?: boolean;

  /**
   * Convenience callback for consumers
   */
  onFilesChange?: (files: File[]) => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * FieldUpload
 *
 * File upload field with label + hint + error and a friendly UI wrapper.
 *
 * Expected global classes:
 * - .field, .field__label, .field__control, .field__hint, .field__error
 * - .field--error, .field--disabled, .field--sm/.field--md/.field--lg
 * - .field-upload, .field-upload__trigger, .field-upload__list, .field-upload__item
 *
 * The component works even if you only have base `.field`/`.input` styles.
 */
export const FieldUpload = forwardRef<HTMLInputElement, FieldUploadProps>(
  (
    {
      label,
      hint,
      error,
      fieldSize = "md",
      containerClassName,
      labelClassName,
      inputClassName,
      placeholder = "No files selected",
      buttonText = "Choose files",
      showRequiredMark = false,
      id,
      required,
      disabled,
      multiple,
      onFilesChange,
      onChange,
      className,
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? `field-upload-${autoId}`;

    const internalRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    const hasError = Boolean(error);

    const describedBy =
      [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;

    const fileNames = useMemo(() => files.map((f) => f.name), [files]);

    function handleTrigger() {
      if (disabled) return;
      (internalRef.current ?? (ref as any)?.current)?.click?.();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const list = Array.from(e.target.files ?? []);
      setFiles(list);
      onFilesChange?.(list);
      onChange?.(e);
    }

    return (
      <div
        className={cx(
          "field",
          "field-upload",
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
          {/* Hidden-ish native input for correct browser behaviour */}
          <input
            {...rest}
            ref={(node) => {
              internalRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as any).current = node;
            }}
            id={inputId}
            type="file"
            required={required}
            disabled={disabled}
            multiple={multiple}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cx("input", "field__input", "field-upload__input", inputClassName)}
            onChange={handleChange}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0
            }}
          />

          <div className="field-upload__row">
            <Button
              variant="soft"
              size="sm"
              onClick={handleTrigger}
              disabled={disabled}
              className="field-upload__trigger"
            >
              {buttonText}
            </Button>

            <div className="field-upload__summary">
              {fileNames.length === 0 ? (
                <span className="muted">{placeholder}</span>
              ) : (
                <span className="muted">
                  {fileNames.length} file{fileNames.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>
          </div>

          {fileNames.length > 0 && (
            <ul className="field-upload__list">
              {fileNames.map((n, i) => (
                <li key={`${n}-${i}`} className="field-upload__item">
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>

        {hint && !error ? (
          <div id={`${inputId}-hint`} className="field__hint">
            {hint}
          </div>
        ) : null}

        {error ? (
          <div id={`${inputId}-error`} className="field__error" role="alert">
            {error}
          </div>
        ) : null}

        {/* Minimal local styles for tidy layout in case globals are sparse */}
        <style>
          {`
            .field-upload__row{
              display:flex;
              align-items:center;
              gap: var(--space-3);
              flex-wrap: wrap;
            }

            .field-upload__summary{
              font-size: var(--fs-1);
            }

            .field-upload__list{
              margin-top: var(--space-2);
              padding-left: 18px;
            }

            .field-upload__item{
              font-size: var(--fs-1);
              color: var(--color-text-muted);
              word-break: break-word;
            }
          `}
        </style>
      </div>
    );
  }
);

FieldUpload.displayName = "FieldUpload";