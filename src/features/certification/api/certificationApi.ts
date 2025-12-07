// agrotrust-az/src/features/certification/api/certificationApi.ts

import { env } from "@/app/config/env";

import type {
  CertificationRecord,
  CertificationStatus,
  CertificationSummary,
  CertificationIssue,
  CertificationIssuer,
  CertificationEvidence,
  CertificationAuditEvent,
  CreateCertificationPayload,
  CreateCertificationResponse,
  UpdateCertificationPayload,
  UpdateCertificationResponse,
  RequestCertificationPayload,
  RequestCertificationResponse,
  VerifyCertificationPayload,
  VerifyCertificationResponse,
  RejectCertificationPayload,
  RejectCertificationResponse
} from "../types";

/**
 * Certification API (Hackathon MVP)
 *
 * Modes:
 * 1) Mock mode (env.enableMocks === true)
 *    - Uses localStorage
 *    - Provides basic lifecycle transitions:
 *      claimed/requested -> pending_review -> verified/rejected
 *
 * 2) Non-mock mode
 *    - Read-only empty list for now
 *    - Mutations throw to avoid misleading behaviour
 *
 * This keeps parity with passport/escrow/lots patterns.
 */

const LS_KEY = "agrotrust_certifications_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function loadMockCerts(): CertificationRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CertificationRecord[];
  } catch {
    return [];
  }
}

function saveMockCerts(items: CertificationRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore for MVP
  }
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normaliseStatus(s?: CertificationStatus): CertificationStatus {
  return s ?? "draft";
}

function addAudit(
  record: CertificationRecord,
  event: Omit<CertificationAuditEvent, "date"> & { date?: string }
): CertificationRecord {
  const audit = safeArray<CertificationAuditEvent>(record.audit);
  const next: CertificationAuditEvent = {
    ...event,
    date: event.date ?? nowIso()
  };

  return {
    ...record,
    audit: [next, ...audit],
    updatedAt: nowIso()
  };
}

function attachEvidence(
  record: CertificationRecord,
  evidence?: CertificationEvidence[]
): CertificationRecord {
  if (!evidence || evidence.length === 0) return record;
  const existing = safeArray<CertificationEvidence>(record.evidence);
  return {
    ...record,
    evidence: [...evidence, ...existing],
    updatedAt: nowIso()
  };
}

function toSummary(c: CertificationRecord): CertificationSummary {
  return {
    id: c.id,
    code: String(c.standard.code),
    label: c.standard.label,
    status: c.status,
    coopName: c.applicant?.coopName,
    lotId: c.scope?.lotId,
    passportId: c.scope?.passportId,
    issuerName: c.issuer?.name,
    issuedAt: c.issuedAt,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt
  };
}

function basicVerifyIssues(c: CertificationRecord): CertificationIssue[] {
  const issues: CertificationIssue[] = [];

  if (!c.standard?.code) {
    issues.push({
      code: "cert.standard.missing",
      message: "Certification standard code is missing.",
      severity: "high"
    });
  }

  if (!c.scope?.coopId && !c.scope?.lotId && !c.scope?.passportId) {
    issues.push({
      code: "cert.scope.missing",
      message: "Certification scope is not specified.",
      severity: "medium"
    });
  }

  if (!c.evidence || c.evidence.length === 0) {
    issues.push({
      code: "cert.evidence.missing",
      message: "No evidence attached to this certification.",
      severity: "low"
    });
  }

  return issues;
}

/**
 * Public read API
 */

export async function listCertifications(): Promise<CertificationRecord[]> {
  if (env.enableMocks) {
    return loadMockCerts();
  }

  return [];
}

export async function listCertificationSummaries(): Promise<CertificationSummary[]> {
  const list = await listCertifications();
  return list.map(toSummary);
}

export async function getCertificationById(id: string): Promise<CertificationRecord | null> {
  const list = await listCertifications();
  return list.find((c) => c.id === id) ?? null;
}

/**
 * Mutations
 */

export async function createCertification(
  payload: CreateCertificationPayload
): Promise<CreateCertificationResponse> {
  if (!env.enableMocks) {
    throw new Error("Certification creation is only available in mock mode for this MVP.");
  }

  const createdAt = nowIso();

  const record: CertificationRecord = {
    id: makeId("CERT"),
    standard: {
      code: payload.standard.code,
      label: payload.standard.label,
      version: payload.standard.version
    },
    status: normaliseStatus(payload.status),
    scope: payload.scope,
    applicant: payload.applicant,
    evidence: payload.evidence ?? [],
    notes: payload.notes,
    audit: [
      {
        id: makeId("CA"),
        type: "created",
        title: "Certification created",
        message: "A new certification record was created.",
        actorRole: "applicant",
        actorName: payload.applicant?.contactName,
        actorOrganisation: payload.applicant?.coopName,
        date: createdAt
      }
    ],
    createdAt,
    updatedAt: createdAt
  };

  const list = loadMockCerts();
  saveMockCerts([record, ...list]);

  return { certification: record };
}

export async function updateCertification(
  payload: UpdateCertificationPayload
): Promise<UpdateCertificationResponse> {
  if (!env.enableMocks) {
    throw new Error("Certification updates are only available in mock mode for this MVP.");
  }

  const list = loadMockCerts();
  const idx = list.findIndex((c) => c.id === payload.id);

  if (idx === -1) {
    throw new Error("Certification not found in demo store.");
  }

  const current = list[idx];

  let next: CertificationRecord = {
    ...current,
    standard: payload.standard
      ? {
          code: payload.standard.code,
          label: payload.standard.label,
          version: payload.standard.version
        }
      : current.standard,
    scope: payload.scope ?? current.scope,
    applicant: payload.applicant ?? current.applicant,
    notes: payload.notes ?? current.notes,
    status: payload.status ?? current.status,
    issuer: payload.issuer ?? current.issuer,
    issuedAt: payload.issuedAt ?? current.issuedAt,
    expiresAt: payload.expiresAt ?? current.expiresAt,
    updatedAt: nowIso()
  };

  next = attachEvidence(next, payload.evidence);

  if (payload.auditEvent) {
    next = addAudit(next, {
      id: makeId("CA"),
      type: payload.auditEvent.type ?? "note",
      title: payload.auditEvent.title,
      message: payload.auditEvent.message,
      actorRole: payload.auditEvent.actorRole,
      actorName: payload.auditEvent.actorName,
      actorOrganisation: payload.auditEvent.actorOrganisation,
      date: payload.auditEvent.date
    });
  }

  const updated = [...list];
  updated[idx] = next;
  saveMockCerts(updated);

  return { certification: next };
}

export async function requestCertification(
  payload: RequestCertificationPayload
): Promise<RequestCertificationResponse> {
  if (!env.enableMocks) {
    throw new Error("Certification requests are only available in mock mode for this MVP.");
  }

  const list = loadMockCerts();
  const idx = list.findIndex((c) => c.id === payload.id);

  if (idx === -1) {
    throw new Error("Certification not found in demo store.");
  }

  const current = list[idx];

  const nextStatus: CertificationStatus =
    current.status === "draft" ? "requested" : "pending_review";

  let next: CertificationRecord = {
    ...current,
    status: nextStatus,
    requestedAt: current.requestedAt ?? nowIso(),
    updatedAt: nowIso()
  };

  next = addAudit(next, {
    id: makeId("CA"),
    type: "submitted",
    title: "Certification requested",
    message:
      payload.message ??
      "Applicant requested certification review for the listed scope.",
    actorRole: "applicant",
    actorName: current.applicant?.contactName,
    actorOrganisation: current.applicant?.coopName
  });

  const updated = [...list];
  updated[idx] = next;
  saveMockCerts(updated);

  return { certification: next };
}

export async function verifyCertification(
  payload: VerifyCertificationPayload
): Promise<VerifyCertificationResponse> {
  if (!env.enableMocks) {
    throw new Error("Certification verification is only available in mock mode for this MVP.");
  }

  const list = loadMockCerts();
  const idx = list.findIndex((c) => c.id === payload.id);

  if (idx === -1) {
    throw new Error("Certification not found in demo store.");
  }

  const current = list[idx];

  const issuer: CertificationIssuer | undefined =
    payload.issuer ?? current.issuer ?? {
      name: "Demo Auditor",
      country: "Azerbaijan",
      accreditation: "MVP-DEMO"
    };

  const issuedAt = payload.issuedAt ?? current.issuedAt ?? nowIso();

  // Simple demo: 365 days validity if not specified
  const expiresAt =
    payload.expiresAt ??
    current.expiresAt ??
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  let next: CertificationRecord = {
    ...current,
    issuer,
    status: "verified",
    reviewedAt: nowIso(),
    issuedAt,
    expiresAt,
    updatedAt: nowIso()
  };

  next = addAudit(next, {
    id: makeId("CA"),
    type: "verified",
    title: "Certification verified",
    message: payload.note ?? "Certification verified for the demo.",
    actorRole: "auditor",
    actorName: issuer.name,
    actorOrganisation: issuer.name
  });

  const issues = basicVerifyIssues(next);

  const updated = [...list];
  updated[idx] = next;
  saveMockCerts(updated);

  return {
    certification: next,
    verifiedAt: nowIso(),
    issues
  };
}

export async function rejectCertification(
  payload: RejectCertificationPayload
): Promise<RejectCertificationResponse> {
  if (!env.enableMocks) {
    throw new Error("Certification rejection is only available in mock mode for this MVP.");
  }

  const list = loadMockCerts();
  const idx = list.findIndex((c) => c.id === payload.id);

  if (idx === -1) {
    throw new Error("Certification not found in demo store.");
  }

  const current = list[idx];

  let next: CertificationRecord = {
    ...current,
    status: "rejected",
    reviewedAt: nowIso(),
    updatedAt: nowIso()
  };

  next = addAudit(next, {
    id: makeId("CA"),
    type: "rejected",
    title: "Certification rejected",
    message: payload.reason ?? "Rejected during demo review.",
    actorRole: "auditor",
    actorName: current.issuer?.name ?? "Demo Auditor",
    actorOrganisation: current.issuer?.name
  });

  const updated = [...list];
  updated[idx] = next;
  saveMockCerts(updated);

  return {
    certification: next,
    rejectedAt: nowIso()
  };
}

/**
 * Local-only helpers
 */

export function listMockCertificationsSync(): CertificationRecord[] {
  return loadMockCerts();
}

export function clearMockCertifications() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}