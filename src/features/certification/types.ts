// agrotrust-az/src/features/certification/types.ts

/**
 * Certification feature types
 *
 * Purpose in AgroTrust AZ MVP:
 * - Allow cooperatives to declare/request certifications for lots
 * - Provide a lightweight verification model for hackathon demo
 * - Align with Digital Product Passport certifications
 *
 * In production, this would integrate:
 * - Accredited auditors
 * - Lab results
 * - Government/standards registries
 * - Expiry/renewal workflows
 */

export type CertificationStandardCode =
  | "GlobalG.A.P"
  | "Organic"
  | "HACCP"
  | "ISO_22000"
  | "Halal"
  | "Kosher"
  | "Other";

export type CertificationStatus =
  | "draft"
  | "claimed"
  | "requested"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired"
  | "revoked";

export type CertificationEvidenceType =
  | "document"
  | "lab-report"
  | "photo"
  | "invoice"
  | "other";

export type CertificationEvidence = {
  id?: string;
  type: CertificationEvidenceType;
  url: string;
  label?: string;
  uploadedAt?: string; // ISO
};

export type CertificationIssuer = {
  id?: string;
  name: string;
  country?: string;

  /**
   * For MVP this is free-form.
   * In production, you would store accreditation IDs.
   */
  accreditation?: string;
  website?: string;
};

export type CertificationApplicant = {
  coopId?: string;
  coopName?: string;

  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type CertificationScope = {
  /**
   * The certification can be attached to:
   * - a cooperative (org-level)
   * - a specific lot
   * - a passport
   */
  coopId?: string;
  lotId?: string;
  passportId?: string;

  /**
   * Optional product hint for reviewer UX.
   */
  productName?: string;
  category?: string;
  region?: string;
};

export type CertificationAuditEventType =
  | "created"
  | "submitted"
  | "review_started"
  | "evidence_added"
  | "verified"
  | "rejected"
  | "expired"
  | "revoked"
  | "note"
  | "custom";

export type CertificationAuditEvent = {
  id?: string;
  type: CertificationAuditEventType;
  title?: string;
  message?: string;

  actorRole?: "applicant" | "auditor" | "admin" | "system";
  actorName?: string;
  actorOrganisation?: string;

  date: string; // ISO
};

export type CertificationRecord = {
  id: string;

  standard: {
    code: CertificationStandardCode | string;
    label?: string; // display label for custom codes
    version?: string;
  };

  status: CertificationStatus;

  scope?: CertificationScope;
  applicant?: CertificationApplicant;
  issuer?: CertificationIssuer;

  /**
   * Dates
   */
  requestedAt?: string; // ISO
  reviewedAt?: string; // ISO
  issuedAt?: string; // ISO
  expiresAt?: string; // ISO

  /**
   * Evidence bundle for demo-grade trust
   */
  evidence?: CertificationEvidence[];

  /**
   * Human notes helpful in a judge demo
   */
  notes?: string;

  /**
   * Small audit trail
   */
  audit?: CertificationAuditEvent[];

  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

/**
 * Convenience shapes for UI lists/cards
 */
export type CertificationSummary = {
  id: string;

  code: string;
  label?: string;

  status: CertificationStatus;

  coopName?: string;
  lotId?: string;
  passportId?: string;

  issuerName?: string;

  issuedAt?: string;
  expiresAt?: string;

  createdAt: string;
};

/**
 * Simple client-side issues for validation/verification
 */
export type CertificationIssue = {
  code: string;
  message: string;
  severity?: "low" | "medium" | "high";
};

/**
 * API contracts (client expectations)
 *
 * For the hackathon MVP these may be backed by:
 * - localStorage mocks
 * - later Netlify functions if you decide to add them
 */
export type CreateCertificationPayload = {
  standard: {
    code: CertificationStandardCode | string;
    label?: string;
    version?: string;
  };

  scope?: CertificationScope;
  applicant?: CertificationApplicant;

  /**
   * Optional starting evidence
   */
  evidence?: CertificationEvidence[];

  notes?: string;

  /**
   * If you want to create already claimed/requested.
   */
  status?: CertificationStatus;
};

export type CreateCertificationResponse = {
  certification: CertificationRecord;
};

export type UpdateCertificationPayload = Partial<CreateCertificationPayload> & {
  id: string;

  /**
   * Allow setting issuer/review outcome in demo admin flows.
   */
  issuer?: CertificationIssuer;
  status?: CertificationStatus;

  issuedAt?: string;
  expiresAt?: string;

  auditEvent?: Omit<CertificationAuditEvent, "date"> & {
    date?: string;
  };
};

export type UpdateCertificationResponse = {
  certification: CertificationRecord;
};

export type RequestCertificationPayload = {
  id: string;

  /**
   * Optional message for auditors/admin
   */
  message?: string;
};

export type RequestCertificationResponse = {
  certification: CertificationRecord;
};

export type VerifyCertificationPayload = {
  id: string;

  issuer?: CertificationIssuer;

  issuedAt?: string;
  expiresAt?: string;

  /**
   * Optional supporting note
   */
  note?: string;
};

export type VerifyCertificationResponse = {
  certification: CertificationRecord;
  verifiedAt?: string;
  issues?: CertificationIssue[];
};

export type RejectCertificationPayload = {
  id: string;
  reason?: string;
};

export type RejectCertificationResponse = {
  certification: CertificationRecord;
  rejectedAt?: string;
};

/**
 * Filtering helpers for pages
 */
export type CertificationFilter = {
  text?: string;

  code?: string | "all";
  status?: CertificationStatus | "all";

  coopId?: string;
  lotId?: string;
  passportId?: string;

  issuerName?: string;

  expiringWithinDays?: number;
};

export type CertificationSort =
  | "newest"
  | "oldest"
  | "status"
  | "expires_asc"
  | "expires_desc";

/**
 * Light type guards
 */
export function isCertificationRecord(v: unknown): v is CertificationRecord {
  return Boolean(v) && typeof v === "object" && "id" in (v as any);
}