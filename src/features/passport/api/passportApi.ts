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

const CREATE_ENDPOINT = "/api/passport/create";
const VERIFY_ENDPOINT = "/api/passport/verify";


const LS_KEY = "agrotrust_passports_v1";

function safeJsonParse<T>(text: string): T | null {
  try {
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function shortText(text: string, max = 500) {
  const t = (text || "").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function normaliseStatus(valid: boolean): PassportStatus {
  return valid ? ("verified" as PassportStatus) : ("submitted" as PassportStatus);
}

async function readErrorText(res: Response) {
  const text = await res.text().catch(() => "");
  const maybe = safeJsonParse<any>(text);
  const msg =
    maybe?.message ||
    maybe?.error?.message ||
    maybe?.error ||
    (typeof maybe === "string" ? maybe : "") ||
    shortText(text);
  return msg || `Request failed (${res.status}).`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(await readErrorText(res));
  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin"
  });

  if (!res.ok) throw new Error(await readErrorText(res));
  return (await res.json()) as T;
}

function toBackendCreatePayload(payload: CreatePassportPayload): any {
  const p: any = payload as any;

  const lotId = String(p.lotId ?? "").trim();

  const cooperativeId =
    (typeof p.cooperativeId === "string" && p.cooperativeId.trim()) ||
    (typeof p.coopId === "string" && p.coopId.trim()) ||
    (typeof p.owner?.id === "string" && p.owner.id.trim()) ||
    (typeof p.owner?.cooperativeId === "string" && p.owner.cooperativeId.trim()) ||
    undefined;

  const productName =
    (typeof p.product?.name === "string" && p.product.name.trim()) ||
    (typeof p.productName === "string" && p.productName.trim()) ||
    "";

  const variety =
    (typeof p.product?.variety === "string" && p.product.variety.trim()) ||
    (typeof p.variety === "string" && p.variety.trim()) ||
    undefined;

  const quantity =
    typeof p.product?.quantity === "number"
      ? p.product.quantity
      : typeof p.quantityKg === "number"
        ? p.quantityKg
        : typeof p.quantity === "number"
          ? p.quantity
          : undefined;

  const unit =
    (typeof p.product?.unit === "string" && p.product.unit.trim()) ||
    (typeof p.unit === "string" && p.unit.trim()) ||
    "kg";

  const region =
    (typeof p.harvest?.region === "string" && p.harvest.region.trim()) ||
    (typeof p.region === "string" && p.region.trim()) ||
    undefined;

  const harvestDate =
    (typeof p.harvest?.harvestDate === "string" && p.harvest.harvestDate.trim()) ||
    (typeof p.harvestDate === "string" && p.harvestDate.trim()) ||
    undefined;

  const certifications = Array.isArray(p.certifications)
    ? p.certifications.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim())
    : [];

  return {
    lotId,
    cooperativeId,
    product: {
      name: productName,
      variety,
      quantity,
      unit
    },
    harvest: {
      region,
      harvestDate
    },
    certifications
  };
}

function toFrontendCreateResponse(
  originalPayload: CreatePassportPayload,
  apiResp: any
): CreatePassportResponse {
  const now = new Date().toISOString();
  const passportId = String(apiResp?.passportId ?? "").trim();
  const lotId = String(apiResp?.lotId ?? (originalPayload as any)?.lotId ?? "").trim();

  const qrData =
    (typeof apiResp?.qrPayload === "string" && apiResp.qrPayload) ||
    buildQrData(passportId || lotId);

  const base: Passport = {
    id: passportId || `PP-${Math.floor(Math.random() * 9000) + 1000}`,
    lotId,
    owner: (originalPayload as any)?.owner,
    product: (originalPayload as any)?.product,
    certifications: (originalPayload as any)?.certifications ?? [],
    inputs: (originalPayload as any)?.inputs ?? [],
    traceability: (originalPayload as any)?.traceability ?? [],
    media: (originalPayload as any)?.media ?? [],
    qrData,
    status: "submitted" as PassportStatus,
    createdAt: apiResp?.createdAt || now,
    updatedAt: apiResp?.createdAt || now
  };

  const validity = inferPassportValidity(base);
  const passport: Passport = {
    ...base,
    status: normaliseStatus(validity.valid),
    updatedAt: now
  };

  return { passport };
}


function toFrontendVerifyResponse(apiResp: any): VerifyPassportResponse {
  const checkedAt = apiResp?.checkedAt || new Date().toISOString();

  if (!apiResp?.ok || !apiResp?.verified) {
    return {
      valid: false,
      verifiedAt: checkedAt,
      issues: [
        {
          code: "passport.not_verified",
          message: apiResp?.message || "Passport could not be verified.",
          severity: "high"
        }
      ]
    };
  }

  const passportId = String(apiResp?.passportId ?? "").trim();
  const lotId = String(apiResp?.lotId ?? "").trim();

  const qrData =
    (typeof apiResp?.data?.qrPayload === "string" && apiResp.data.qrPayload) ||
    buildQrData(passportId || lotId);

  const summary = apiResp?.summary ?? {};
  const passport: Passport = {
    id: passportId,
    lotId,
    owner: {
      id: apiResp?.data?.passport?.cooperativeId || summary?.cooperativeId || undefined
    } as any,
    product: {
      name: summary?.product ?? "Agricultural lot",
      variety: summary?.variety ?? undefined,
      quantity: summary?.quantityKg ?? undefined,
      unit: summary?.unit ?? "kg"
    } as any,
    certifications: [],
    inputs: [],
    traceability: [],
    media: [],
    qrData,
    status: "verified" as PassportStatus,
    createdAt: apiResp?.data?.passport?.createdAt || checkedAt,
    updatedAt: checkedAt
  };

  const issues =
    Array.isArray(apiResp?.checks)
      ? apiResp.checks
          .filter((c: any) => c?.status && c.status !== "PASS")
          .map((c: any) => ({
            code: `passport.check.${String(c.name || "check").toLowerCase().replace(/\s+/g, "_")}`,
            message: c?.detail || `${c?.name} reported ${c?.status}`,
            severity: c.status === "FAIL" ? "high" : "medium"
          }))
      : [];

  return {
    valid: true,
    passport,
    verifiedAt: checkedAt,
    issues
  };
}

function extractPassportIdFromQrData(qrData: string): string | null {
  const raw = (qrData || "").trim();
  if (!raw) return null;

  const parsed = safeJsonParse<any>(raw);
  if (parsed && typeof parsed === "object" && typeof parsed.passportId === "string") {
    return parsed.passportId.trim();
  }

  const match = raw.match(/[?&]passportId=([^&]+)/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return match[1].trim();
    }
  }

  return raw;
}


export async function createPassport(
  payload: CreatePassportPayload
): Promise<CreatePassportResponse> {
  
  if (env.enableMocks) {
    
  }

  const backendPayload = toBackendCreatePayload(payload);
  const apiResp = await postJson<any>(CREATE_ENDPOINT, backendPayload);
  return toFrontendCreateResponse(payload, apiResp);
}

export async function verifyPassport(
  req: VerifyPassportRequest
): Promise<VerifyPassportResponse> {
  if (env.enableMocks) {
  }

  if ("passportId" in req && typeof (req as any).passportId === "string") {
    const pid = String((req as any).passportId).trim();
    const url = `${VERIFY_ENDPOINT}?passportId=${encodeURIComponent(pid)}`;
    const apiResp = await getJson<any>(url);
    return toFrontendVerifyResponse(apiResp);
  }

  if ("qrData" in req && typeof (req as any).qrData === "string") {
    const pid = extractPassportIdFromQrData(String((req as any).qrData));
    if (!pid) {
      return {
        valid: false,
        verifiedAt: new Date().toISOString(),
        issues: [
          {
            code: "passport.qr_invalid",
            message: "QR data did not contain a passportId.",
            severity: "high"
          }
        ]
      };
    }

    const url = `${VERIFY_ENDPOINT}?passportId=${encodeURIComponent(pid)}`;
    const apiResp = await getJson<any>(url);
    return toFrontendVerifyResponse(apiResp);
  }

  const apiResp = await postJson<any>(VERIFY_ENDPOINT, req);
  return toFrontendVerifyResponse(apiResp);
}

export async function getPassportById(passportId: string): Promise<Passport | null> {
  const res = await verifyPassport({ passportId } as any);
  return (res as any).passport ?? null;
}

export function listMockPassports(): Passport[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Passport[]) : [];
  } catch {
    return [];
  }
}

export function clearMockPassports() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
  }
}
