// agrotrust-az/src/features/passport/api/passportApi.ts

import { env } from "@/app/config/env";
import {
  type CreatePassportPayload,
  type CreatePassportResponse,
  type Passport,
  type PassportStatus,
  type VerifyPassportRequest,
  type VerifyPassportResponse
} from "../types";
import { buildQrData, inferPassportValidity } from "../utils";

/**
 * Passport API
 *
 * Supports two modes:
 * 1) Mock mode (env.enableMocks === true)
 *    - Uses localStorage as a tiny in-browser store
 *    - Great for hackathon demos without a backend
 *
 * 2) Function mode
 *    - Calls Netlify Functions:
 *      /.netlify/functions/passport-create
 *      /.netlify/functions/passport-verify
 */

const FN_BASE = "/.netlify/functions";
const CREATE_ENDPOINT = `${FN_BASE}/passport-create`;
const VERIFY_ENDPOINT = `${FN_BASE}/passport-verify`;

const LS_KEY = "agrotrust_passports_v1";

function loadMockPassports(): Passport[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Passport[];
  } catch {
    return [];
  }
}

function saveMockPassports(items: Passport[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore for MVP
  }
}

function makeId(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function normaliseStatusForDemo(valid: boolean): PassportStatus {
  return valid ? "verified" : "submitted";
}

async function mockCreatePassport(
  payload: CreatePassportPayload
): Promise<CreatePassportResponse> {
  const now = new Date().toISOString();
  const id = makeId("PP");

  const basePassport: Passport = {
    id,
    lotId: payload.lotId,
    owner: payload.owner,
    product: payload.product,
    certifications: payload.certifications ?? [],
    inputs: payload.inputs ?? [],
    traceability: payload.traceability ?? [],
    media: payload.media ?? [],
    qrData: buildQrData(id),
    status: "draft",
    createdAt: now,
    updatedAt: now
  };

  const validity = inferPassportValidity(basePassport);

  const passport: Passport = {
    ...basePassport,
    status: normaliseStatusForDemo(validity.valid),
    updatedAt: new Date().toISOString()
  };

  const existing = loadMockPassports();
  saveMockPassports([passport, ...existing]);

  return { passport };
}

async function mockVerifyPassport(
  req: VerifyPassportRequest
): Promise<VerifyPassportResponse> {
  const list = loadMockPassports();

  let found: Passport | undefined;

  if ("passportId" in req) {
    found = list.find((p) => p.id === req.passportId);
  } else if ("qrData" in req) {
    found = list.find((p) => p.qrData === req.qrData);
  }

  if (!found) {
    return {
      valid: false,
      verifiedAt: new Date().toISOString(),
      issues: [
        {
          code: "passport.not_found",
          message: "Passport could not be found in the demo store.",
          severity: "high"
        }
      ]
    };
  }

  const validity = inferPassportValidity(found);

  return {
    valid: validity.valid,
    passport: found,
    verifiedAt: new Date().toISOString(),
    issues: validity.issues
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Request failed.");
  }

  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Request failed.");
  }

  return (await res.json()) as T;
}

/**
 * Public API
 */

export async function createPassport(
  payload: CreatePassportPayload
): Promise<CreatePassportResponse> {
  if (env.enableMocks) {
    return mockCreatePassport(payload);
  }

  return postJson<CreatePassportResponse>(CREATE_ENDPOINT, payload);
}

export async function verifyPassport(
  req: VerifyPassportRequest
): Promise<VerifyPassportResponse> {
  if (env.enableMocks) {
    return mockVerifyPassport(req);
  }

  // Prefer GET for quick QR-style verification where possible
  if ("passportId" in req) {
    const url = `${VERIFY_ENDPOINT}?passportId=${encodeURIComponent(req.passportId)}`;
    return getJson<VerifyPassportResponse>(url);
  }

  if ("qrData" in req) {
    const url = `${VERIFY_ENDPOINT}?qrData=${encodeURIComponent(req.qrData)}`;
    return getJson<VerifyPassportResponse>(url);
  }

  // Fallback to POST (defensive)
  return postJson<VerifyPassportResponse>(VERIFY_ENDPOINT, req);
}

/**
 * Convenience helpers for UI layers
 */

export async function getPassportById(passportId: string): Promise<Passport | null> {
  const res = await verifyPassport({ passportId });
  return res.passport ?? null;
}

export function listMockPassports(): Passport[] {
  return loadMockPassports();
}

export function clearMockPassports() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}