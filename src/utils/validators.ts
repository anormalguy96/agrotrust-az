// agrotrust-az/src/utils/validators.ts

/**
 * Validation utilities for AgroTrust AZ (MVP)
 *
 * Design:
 * - Lightweight, dependency-free
 * - Friendly error messages for UI
 * - Works with simple form components and future form libraries
 *
 * Convention:
 * - Validators return a string error message or null when valid.
 */

export type ValidationError = string | null;

export type Validator<T = any> = (value: T) => ValidationError;

export type FieldValidators<T = any> = Validator<T> | Validator<T>[];

/**
 * Core helpers
 */

export function asArray<T>(v?: FieldValidators<T>): Validator<T>[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function composeValidators<T>(...validators: Validator<T>[]): Validator<T> {
  const list = validators.filter(Boolean);
  return (value: T) => {
    for (const fn of list) {
      const err = fn(value);
      if (err) return err;
    }
    return null;
  };
}

export function validate<T>(value: T, validators?: FieldValidators<T>): ValidationError {
  const list = asArray(validators);
  for (const fn of list) {
    const err = fn(value);
    if (err) return err;
  }
  return null;
}

/**
 * Primitive checks
 */

export function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function required(message = "This field is required."): Validator<any> {
  return (value) => (isEmpty(value) ? message : null);
}

export function requiredString(message = "Please enter a value."): Validator<string> {
  return (value) => (isEmpty(value) ? message : null);
}

export function minLength(min: number, message?: string): Validator<string> {
  const msg = message ?? `Please enter at least ${min} characters.`;
  return (value) => {
    const s = String(value ?? "");
    return s.trim().length < min ? msg : null;
  };
}

export function maxLength(max: number, message?: string): Validator<string> {
  const msg = message ?? `Please enter no more than ${max} characters.`;
  return (value) => {
    const s = String(value ?? "");
    return s.trim().length > max ? msg : null;
  };
}

export function pattern(re: RegExp, message = "Value format is invalid."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    return re.test(String(value)) ? null : message;
  };
}

/**
 * Email / URL
 */

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function email(message = "Please enter a valid email address."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    return EMAIL_RE.test(String(value).trim()) ? null : message;
  };
}

export function url(message = "Please enter a valid URL."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    try {
      // Accepts http(s) and other valid schemes for flexibility
      // but you can wrap with pattern() if you want stricter rules.
      new URL(String(value));
      return null;
    } catch {
      return message;
    }
  };
}

/**
 * Numbers
 */

export function number(
  message = "Please enter a valid number."
): Validator<number | string> {
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === "number" ? value : Number(String(value));
    return Number.isFinite(n) ? null : message;
  };
}

export function integer(
  message = "Please enter a whole number."
): Validator<number | string> {
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === "number" ? value : Number(String(value));
    if (!Number.isFinite(n)) return message;
    return Number.isInteger(n) ? null : message;
  };
}

export function minNumber(min: number, message?: string): Validator<number | string> {
  const msg = message ?? `Value must be at least ${min}.`;
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === "number" ? value : Number(String(value));
    if (!Number.isFinite(n)) return "Please enter a valid number.";
    return n < min ? msg : null;
  };
}

export function maxNumber(max: number, message?: string): Validator<number | string> {
  const msg = message ?? `Value must be no more than ${max}.`;
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === "number" ? value : Number(String(value));
    if (!Number.isFinite(n)) return "Please enter a valid number.";
    return n > max ? msg : null;
  };
}

export function positiveNumber(
  message = "Value must be greater than 0."
): Validator<number | string> {
  return minNumber(0.0000001, message);
}

/**
 * Dates (ISO strings)
 */

export function isIsoDateString(value?: string) {
  if (!value) return false;
  const t = Date.parse(value);
  return Number.isFinite(t);
}

export function isoDate(message = "Please enter a valid date."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    return isIsoDateString(String(value)) ? null : message;
  };
}

export function futureDate(message = "Date must be in the future."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    const s = String(value);
    if (!isIsoDateString(s)) return "Please enter a valid date.";
    return Date.parse(s) > Date.now() ? null : message;
  };
}

export function pastDate(message = "Date must be in the past."): Validator<string> {
  return (value) => {
    if (isEmpty(value)) return null;
    const s = String(value);
    if (!isIsoDateString(s)) return "Please enter a valid date.";
    return Date.parse(s) < Date.now() ? null : message;
  };
}

/**
 * Choice helpers
 */

export function oneOf<T>(
  allowed: readonly T[],
  message = "Please select a valid option."
): Validator<T> {
  return (value) => {
    if (value === null || value === undefined) return null;
    return allowed.includes(value) ? null : message;
  };
}

/**
 * File validators (for FieldUpload)
 * Works with File, FileList, or an array of File.
 */

function normaliseFiles(value: unknown): File[] {
  if (!value) return [];
  if (value instanceof File) return [value];
  if (value instanceof FileList) return Array.from(value);
  if (Array.isArray(value) && value.every((v) => v instanceof File)) return value as File[];
  return [];
}

export function fileRequired(message = "Please upload a file."): Validator<any> {
  return (value) => {
    const files = normaliseFiles(value);
    return files.length === 0 ? message : null;
  };
}

export function fileSizeMax(
  maxBytes: number,
  message?: string
): Validator<any> {
  const msg =
    message ?? `File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`;

  return (value) => {
    const files = normaliseFiles(value);
    if (files.length === 0) return null;

    const tooBig = files.find((f) => f.size > maxBytes);
    return tooBig ? msg : null;
  };
}

export function fileTypesAllowed(
  allowedMime: readonly string[],
  message = "File type is not allowed."
): Validator<any> {
  return (value) => {
    const files = normaliseFiles(value);
    if (files.length === 0) return null;

    const bad = files.find((f) => !allowedMime.includes(f.type));
    return bad ? message : null;
  };
}

/**
 * Domain-friendly presets
 * These are optional conveniences for AgroTrust screens.
 */

export const lotQuantityValidators = [
  required("Quantity is required."),
  number("Quantity must be a number."),
  positiveNumber("Quantity must be greater than 0.")
] satisfies Validator<any>[];

export const priceValidators = [
  number("Price must be a number."),
  minNumber(0, "Price cannot be negative.")
] satisfies Validator<any>[];

export const emailValidators = [
  requiredString("Email is required."),
  email()
] satisfies Validator<any>[];