// agrotrust-az/src/types/api.ts

/**
 * Shared API contract types for AgroTrust AZ.
 *
 * Scope:
 * - Generic API envelope + error shape
 * - Netlify Function request/response types (MVP)
 *
 * These types intentionally depend only on /types/domain
 * to avoid circular imports between feature modules.
 */

import type {
  ID,
  ISODateString,
  Currency,
  LotId,
  CoopId,
  BuyerId,
  PassportId,
  RFQId,
  EscrowId,
  DigitalProductPassport,
  CertificationRef,
  TraceabilityEntry,
  CommodityCategory,
  Unit
} from "./domain";

/* ---------------------------------- */
/* Generic API envelope                */
/* ---------------------------------- */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORISED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "MOCK_ONLY"
  | (string & {});

export type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};

export type ApiOk<T> = {
  ok: true;
  data: T;
  meta?: {
    requestId?: string;
    ts?: ISODateString;
  };
};

export type ApiFail = {
  ok: false;
  error: ApiErrorPayload;
  meta?: {
    requestId?: string;
    ts?: ISODateString;
  };
};

export type ApiResponse<T> = ApiOk<T> | ApiFail;

/* ---------------------------------- */
/* Netlify Functions names             */
/* ---------------------------------- */

export type FunctionName =
  | "health"
  | "passport-create"
  | "passport-verify"
  | "escrow-init"
  | "escrow-release";

/* ---------------------------------- */
/* Health                              */
/* ---------------------------------- */

export type HealthResponseData = {
  service: "agrotrust-az";
  status: "ok";
  version?: string;
  time: ISODateString;
  mocksEnabled?: boolean;
};

export type HealthResponse = ApiResponse<HealthResponseData>;

/* ---------------------------------- */
/* Passport (Digital Product Passport) */
/* ---------------------------------- */

/**
 * Minimal payload for creating a passport.
 * The function may enrich this server-side in a real system.
 */
export type PassportCreateRequest = {
  lotId?: LotId;
  coopId?: CoopId;

  productName: string;
  category?: CommodityCategory;
  variety?: string;

  harvestDate?: ISODateString;

  origin?: DigitalProductPassport["origin"];

  inputs?: DigitalProductPassport["inputs"];

  photos?: string[];

  certifications?: CertificationRef[];

  timeline?: TraceabilityEntry[];
};

export type PassportCreateResponseData = {
  passport: DigitalProductPassport;
  qrPayload: string;
};

export type PassportCreateResponse = ApiResponse<PassportCreateResponseData>;

/**
 * Verification can be done by passportId or by raw QR payload.
 */
export type PassportVerifyRequest = {
  passportId?: PassportId;
  qrPayload?: string;

  /**
   * Optional: buyer context for audit.
   */
  buyerId?: BuyerId;
};

export type PassportVerifyResponseData = {
  valid: boolean;

  /**
   * Present when valid and available in the data store.
   */
  passport?: DigitalProductPassport;

  /**
   * Human-friendly reasons when invalid.
   */
  reasons?: string[];
};

export type PassportVerifyResponse = ApiResponse<PassportVerifyResponseData>;

/* ---------------------------------- */
/* Escrow (demo smart contract)        */
/* ---------------------------------- */

export type EscrowStatus =
  | "draft"
  | "funded"
  | "in_inspection"
  | "released"
  | "refunded"
  | "disputed";

export type EscrowInitRequest = {
  rfqId?: RFQId;
  lotId?: LotId;

  buyerId: BuyerId;
  coopId: CoopId;

  /**
   * Commercial
   */
  amount: number;
  currency: Currency;

  /**
   * Optional inspection details for demo narratives.
   */
  inspection?: {
    authority?: string; // e.g., "Border Inspection Service"
    location?: string;  // e.g., "Baku logistics hub"
    expectedBy?: ISODateString;
  };

  /**
   * Simple condition string for MVP messaging.
   * In real life this would be structured and enforceable on-chain/off-chain.
   */
  releaseCondition?: string;
};

export type EscrowInitResponseData = {
  escrowId: EscrowId;
  status: EscrowStatus;

  fundedAmount: number;
  currency: Currency;

  createdAt: ISODateString;
};

export type EscrowInitResponse = ApiResponse<EscrowInitResponseData>;

export type EscrowReleaseRequest = {
  escrowId: EscrowId;

  /**
   * Demo evidence references
   */
  inspectionPassed?: boolean;
  inspectionReportUrl?: string;
  notes?: string;

  /**
   * Partial release for future extension.
   */
  releaseAmount?: number;
};

export type EscrowReleaseResponseData = {
  escrowId: EscrowId;
  status: EscrowStatus;

  releasedAmount?: number;
  currency: Currency;

  releasedAt: ISODateString;
};

export type EscrowReleaseResponse = ApiResponse<EscrowReleaseResponseData>;

/* ---------------------------------- */
/* Optional helper payloads            */
/* ---------------------------------- */

/**
 * A generic upload descriptor you may reuse later
 * if you add file-based evidence for certifications/inspection.
 */
export type UploadDescriptor = {
  id: ID;
  filename: string;
  mime?: string;
  sizeBytes?: number;
  url?: string;
  createdAt?: ISODateString;
};

/**
 * A lightweight commercial line you can reuse in future API docs.
 */
export type TradeLine = {
  productName: string;
  category?: CommodityCategory;
  variety?: string;

  quantity: number;
  unit: Unit;

  unitPrice?: number;
  currency?: Currency;
};