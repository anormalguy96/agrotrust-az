// agrotrust-az/src/features/passport/types.ts

/**
 * Passport feature domain types
 *
 * This file defines the core data shapes for the hackathon MVP:
 * - Digital Product Passport
 * - Traceability timeline
 * - Input logs (fertiliser / pesticide)
 * - API request/response contracts (client-side expectations)
 *
 * Keep these types stable as you expand to real certification providers.
 */

export type PassportStatus =
  | "draft"
  | "submitted"
  | "verified"
  | "rejected"
  | "expired";

export type TraceEventType =
  | "planting"
  | "fertiliser"
  | "pesticide"
  | "irrigation"
  | "harvest"
  | "sorting"
  | "packaging"
  | "storage"
  | "transport"
  | "inspection"
  | "custom";

export type TraceAttachment = {
  id?: string;
  url: string;
  type?: "photo" | "document" | "other";
  label?: string;
};

export type TraceGeo = {
  lat?: number;
  lng?: number;
  locationName?: string;
};

export type TraceabilityRecord = {
  id?: string;
  type: TraceEventType;
  date: string; // ISO string
  title?: string;
  notes?: string;

  /**
   * Optional structured add-ons
   */
  geo?: TraceGeo;
  attachments?: TraceAttachment[];
};

export type InputLogType = "fertiliser" | "pesticide" | "other";

export type InputLog = {
  id?: string;
  type: InputLogType;
  name: string;
  appliedAt: string; // ISO string

  quantity?: number;
  unit?: string;

  /**
   * If you later integrate approval rules, this field becomes useful.
   */
  approved?: boolean;

  photoUrl?: string;
  notes?: string;
};

export type PassportMedia = {
  id?: string;
  url: string;
  type?: "photo" | "certificate" | "lab-report" | "other";
  label?: string;
};

export type PassportCertification = {
  code: string; // e.g., "GlobalG.A.P", "Organic"
  issuer?: string;
  issuedAt?: string; // ISO
  expiresAt?: string; // ISO
  status?: "claimed" | "pending" | "verified";
  documentUrl?: string;
};

export type PassportOwner = {
  coopId?: string;
  coopName?: string;
  farmName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type PassportProduct = {
  product: string; // Keep flexible for MVP
  variety?: string;
  grade?: string;

  region?: string;
  harvestDate?: string; // ISO
  quantityKg?: number;
};

export type Passport = {
  id: string;

  /**
   * Optional linkage to a marketplace lot.
   */
  lotId?: string;

  owner?: PassportOwner;
  product: PassportProduct;

  /**
   * Certifications can be a simple string array in early MVP,
   * but the richer object type is provided for forward growth.
   */
  certifications?: Array<string | PassportCertification>;

  inputs?: InputLog[];
  traceability: TraceabilityRecord[];
  media?: PassportMedia[];

  /**
   * QR payload string that your UI can render.
   * In the MVP this can be a simple URL-like string.
   */
  qrData: string;

  status: PassportStatus;

  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

/**
 * API contracts (client expectations)
 * These align with your Netlify Functions:
 * - passport-create
 * - passport-verify
 */

export type CreatePassportPayload = {
  lotId?: string;
  owner?: PassportOwner;
  product: PassportProduct;

  certifications?: Array<string | PassportCertification>;
  inputs?: InputLog[];
  traceability?: TraceabilityRecord[];
  media?: PassportMedia[];
};

export type CreatePassportResponse = {
  passport: Passport;
};

export type VerifyPassportRequest =
  | { passportId: string }
  | { qrData: string };

export type VerifyPassportIssue = {
  code: string;
  message: string;
  severity?: "low" | "medium" | "high";
};

export type VerifyPassportResponse = {
  valid: boolean;
  passport?: Passport;
  verifiedAt?: string; // ISO
  issues?: VerifyPassportIssue[];
};

/**
 * Small helper unions used by UI components
 */

export type PassportTimelineItem = TraceabilityRecord & {
  /**
   * UI convenience fields
   */
  displayDate?: string;
};

export type PassportSummary = {
  id: string;
  lotId?: string;
  product: string;
  region?: string;
  harvestDate?: string;
  status: PassportStatus;
  coopName?: string;
  createdAt: string;
};