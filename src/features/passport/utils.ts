// agrotrust-az/src/features/passport/utils.ts

import type {
  CreatePassportPayload,
  Passport,
  PassportCertification,
  PassportStatus,
  PassportSummary,
  TraceabilityRecord,
  VerifyPassportIssue
} from "./types";

/**
 * Small, stable utilities for Digital Product Passport (DPP).
 * Keep these functions pure and predictable: great for hackathon demos
 * and easy to extend into production-grade validation later.
 */

const FALLBACK_ORIGIN = "https://agrotrust.az";

function getOriginSafe() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
}

function isStringCert(
  c: string | PassportCertification
): c is string {
  return typeof c === "string";
}

function isObjectCert(
  c: string | PassportCertification
): c is PassportCertification {
  return typeof c !== "string";
}

export function normaliseCertCode(code: string) {
  return code.trim();
}

export function getCertificationCodes(
  passport: Pick<Passport, "certifications">
): string[] {
  const certs = passport.certifications ?? [];

  const codes = certs.map((c) =>
    typeof c === "string" ? c : c.code
  );

  return Array.from(new Set(codes.map(normaliseCertCode))).filter(Boolean);
}

export function getVerifiedCertificationCodes(
  passport: Pick<Passport, "certifications">
): string[] {
  const certs = passport.certifications ?? [];

  const verifiedObjectCerts = certs
    .filter(isObjectCert)
    .filter((c) => c.status === "verified");

  const codes = verifiedObjectCerts.map((c) => normaliseCertCode(c.code));

  return Array.from(new Set(codes)).filter(Boolean);
}

export function hasAnyCertifications(
  passport: Pick<Passport, "certifications">
) {
  return getCertificationCodes(passport).length > 0;
}

export function sortTraceability(
  records: TraceabilityRecord[]
): TraceabilityRecord[] {
  return [...records].sort((a, b) => {
    const da = Date.parse(a.date);
    const db = Date.parse(b.date);
    if (!Number.isFinite(da) && !Number.isFinite(db)) return 0;
    if (!Number.isFinite(da)) return 1;
    if (!Number.isFinite(db)) return -1;
    return da - db;
  });
}

export function getLatestTraceDate(
  records: TraceabilityRecord[]
): string | undefined {
  const sorted = sortTraceability(records);
  return sorted.length ? sorted[sorted.length - 1].date : undefined;
}

/**
 * Builds a QR payload string that is:
 * - stable
 * - readable
 * - demo-friendly
 *
 * In a production system, you might encode a signed token instead.
 */
export function buildQrData(passportId: string) {
  const origin = getOriginSafe();
  // Point to the serverless verifier endpoint in a simple way.
  // This is not a route page; it's a request URL style payload.
  return `${origin}/.netlify/functions/passport-verify?passportId=${encodeURIComponent(
    passportId
  )}`;
}

export function toPassportSummary(passport: Passport): PassportSummary {
  return {
    id: passport.id,
    lotId: passport.lotId,
    product: passport.product.product,
    region: passport.product.region,
    harvestDate: passport.product.harvestDate,
    status: passport.status,
    coopName: passport.owner?.coopName,
    createdAt: passport.createdAt
  };
}

export function statusToTone(status: PassportStatus) {
  switch (status) {
    case "verified":
      return "success";
    case "submitted":
      return "info";
    case "rejected":
      return "danger";
    case "expired":
      return "warning";
    default:
      return "muted";
  }
}

export function formatKg(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString()} kg`;
}

export function formatDateShort(iso?: string) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  try {
    return new Date(t).toLocaleDateString();
  } catch {
    return "—";
  }
}

/**
 * Lightweight payload validation for UI forms.
 * Returns human-friendly issues rather than throwing.
 */
export function validateCreatePassportPayload(
  payload: CreatePassportPayload
): VerifyPassportIssue[] {
  const issues: VerifyPassportIssue[] = [];

  if (!payload.product?.product?.trim()) {
    issues.push({
      code: "product.missing",
      message: "Product name is required.",
      severity: "high"
    });
  }

  if (payload.product?.quantityKg !== undefined) {
    const q = payload.product.quantityKg;
    if (typeof q !== "number" || !Number.isFinite(q) || q <= 0) {
      issues.push({
        code: "product.quantity.invalid",
        message: "Quantity must be a positive number.",
        severity: "medium"
      });
    }
  }

  if (payload.product?.harvestDate) {
    const d = Date.parse(payload.product.harvestDate);
    if (!Number.isFinite(d)) {
      issues.push({
        code: "product.harvestDate.invalid",
        message: "Harvest date must be a valid date.",
        severity: "low"
      });
    }
  }

  const certs = payload.certifications ?? [];
  for (const c of certs) {
    if (typeof c === "string") {
      if (!c.trim()) {
        issues.push({
          code: "cert.empty",
          message: "Certification entries cannot be empty.",
          severity: "low"
        });
      }
    } else {
      if (!c.code?.trim()) {
        issues.push({
          code: "cert.code.missing",
          message: "Certification code is missing.",
          severity: "low"
        });
      }
    }
  }

  return issues;
}

/**
 * A more opinionated, demo-friendly validity heuristic.
 * This is useful for creating quick status labels client-side.
 */
export function inferPassportValidity(passport: Passport) {
  const issues: VerifyPassportIssue[] = [];

  if (!passport.product?.product?.trim()) {
    issues.push({
      code: "product.missing",
      message: "Product name is missing.",
      severity: "high"
    });
  }

  if (!passport.product?.harvestDate) {
    issues.push({
      code: "product.harvestDate.missing",
      message: "Harvest date is not provided.",
      severity: "medium"
    });
  }

  if (!hasAnyCertifications(passport)) {
    issues.push({
      code: "cert.none",
      message: "No certifications listed.",
      severity: "medium"
    });
  }

  if (!passport.traceability?.length) {
    issues.push({
      code: "trace.none",
      message: "No traceability events recorded.",
      severity: "medium"
    });
  }

  const valid =
    issues.find((i) => i.severity === "high") == null;

  return { valid, issues };
}