// agrotrust-az/src/utils/format.ts

/**
 * Formatting utilities for AgroTrust AZ (MVP)
 *
 * Why this exists:
 * - Keep UI components clean
 * - Centralise date, money, quantity, and ID formatting
 * - Avoid repeating small helpers across features
 *
 * These functions are intentionally lightweight and dependency-free.
 */

export type DateFormatPreset =
  | "short"
  | "medium"
  | "long"
  | "withTime"
  | "dateOnly";

export function isValidIsoDate(value?: string) {
  if (!value) return false;
  const t = Date.parse(value);
  return Number.isFinite(t);
}

export function formatDate(
  iso?: string,
  preset: DateFormatPreset = "medium",
  locale?: string
) {
  if (!iso || !isValidIsoDate(iso)) return "—";

  const date = new Date(iso);

  const base: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit"
  };

  const withTime: Intl.DateTimeFormatOptions = {
    ...base,
    hour: "2-digit",
    minute: "2-digit"
  };

  const long: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit"
  };

  const short: Intl.DateTimeFormatOptions = {
    year: "2-digit",
    month: "short",
    day: "2-digit"
  };

  let options: Intl.DateTimeFormatOptions;

  switch (preset) {
    case "short":
      options = short;
      break;
    case "long":
      options = long;
      break;
    case "withTime":
      options = withTime;
      break;
    case "dateOnly":
      options = base;
      break;
    case "medium":
    default:
      options = base;
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function daysTo(iso?: string) {
  if (!iso || !isValidIsoDate(iso)) return undefined;
  const target = Date.parse(iso);
  const diffMs = target - Date.now();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatRelativeDays(iso?: string) {
  const d = daysTo(iso);
  if (typeof d !== "number") return "—";
  if (d === 0) return "today";
  if (d > 0) return `${d} day${d === 1 ? "" : "s"} left`;
  const abs = Math.abs(d);
  return `${abs} day${abs === 1 ? "" : "s"} ago`;
}

export function formatMoney(
  value?: number,
  currency: string = "USD",
  locale?: string,
  maximumFractionDigits = 2
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

export function formatNumber(
  value?: number,
  locale?: string,
  maximumFractionDigits = 2
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  } catch {
    return String(value);
  }
}

export function formatQuantity(
  quantity?: number,
  unit?: string,
  locale?: string
) {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return "—";
  const u = unit ?? "kg";
  const q = formatNumber(quantity, locale, 2);
  return `${q} ${u}`;
}

export function formatId(id?: string) {
  if (!id) return "—";
  return id.trim();
}

/**
 * Basic string casing helpers
 */

export function titleCase(value?: string) {
  if (!value) return "";
  const s = value.replace(/_/g, " ").trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function sentenceCase(value?: string) {
  if (!value) return "";
  const s = value.replace(/_/g, " ").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Domain-friendly label helpers
 * These do not import feature types to avoid circular deps.
 */

export function statusLabel(value?: string) {
  if (!value) return "";
  return sentenceCase(value.replace(/_/g, " "));
}

export function standardLabel(code?: string) {
  if (!code) return "—";

  const map: Record<string, string> = {
    "GlobalG.A.P": "GlobalG.A.P",
    Organic: "Organic",
    HACCP: "HACCP",
    ISO_22000: "ISO 22000",
    Halal: "Halal",
    Kosher: "Kosher"
  };

  return map[code] ?? code;
}

/**
 * Country/region helpers (soft, for UI display)
 */

export function formatLocation(parts: Array<string | null | undefined>) {
  const clean = parts.map((p) => (p ?? "").trim()).filter(Boolean);
  return clean.length ? clean.join(", ") : "—";
}

/**
 * Safe truncation for cards/tables
 */

export function truncate(value?: string, max = 120) {
  const s = (value ?? "").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Simple percentage formatter
 */

export function formatPercent(value?: number, locale?: string, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: digits
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(digits)}%`;
  }
}