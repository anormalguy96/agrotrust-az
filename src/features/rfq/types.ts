// agrotrust-az/src/features/rfq/types.ts

/**
 * RFQ (Request for Quotation) feature types
 *
 * Role in AgroTrust AZ MVP:
 * - Foreign or domestic buyers publish demand for certified, traceable produce.
 * - Cooperatives respond with offers linked to lots and passports.
 * - RFQs can later escalate into escrow-backed contracts.
 *
 * This is a hackathon-friendly model that prioritises clarity and UI speed.
 */

import type { LotUnit, ProduceCategory, LotQualityGrade } from "../lots/types";
import type { EscrowCurrency } from "../escrow/types";

/**
 * Core enumerations
 */

export type RFQStatus =
  | "draft"
  | "open"
  | "shortlisting"
  | "negotiation"
  | "awarded"
  | "closed"
  | "cancelled";

export type RFQPriority = "low" | "medium" | "high";

export type RFQDeliveryMode =
  | "buyer_pickup"
  | "seller_delivery"
  | "third_party_logistics";

export type RFQResponseStatus =
  | "submitted"
  | "updated"
  | "withdrawn"
  | "rejected"
  | "shortlisted"
  | "accepted";

/**
 * Party models
 */

export type RFQBuyer = {
  id: string;
  name: string;
  organisation?: string;

  country?: string;
  city?: string;

  email?: string;
  phone?: string;

  /**
   * Useful for trust signals in UI.
   */
  verified?: boolean;

  /**
   * Optional tags for demo filtering
   */
  tags?: string[];
};

export type RFQCooperative = {
  id: string;
  name: string;

  region?: string;

  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  verified?: boolean;
};

/**
 * Product + quality requirements
 */

export type RFQCertificationRequirement = {
  code: string; // e.g., "GlobalG.A.P", "Organic"
  required?: boolean; // default true
  notes?: string;
};

export type RFQQualityRequirements = {
  grade?: LotQualityGrade | string;

  /**
   * Optional buyer notes.
   */
  sizeSpec?: string;
  colourSpec?: string;
  brixMin?: number; // for fruits (demo only)
  maxDefectRatePct?: number;

  packagingNotes?: string;
};

export type RFQProductRequest = {
  category: ProduceCategory | string;
  name: string; // display label
  variety?: string;

  quantity: number;
  unit: LotUnit;

  /**
   * Convenience for weight-based comparisons
   */
  quantityKgApprox?: number;

  quality?: RFQQualityRequirements;

  certifications?: RFQCertificationRequirement[];
};

/**
 * Commercial terms
 */

export type RFQCommercialTerms = {
  currency: EscrowCurrency;

  /**
   * Unit price expectations.
   */
  targetUnitPrice?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;

  incoterms?: string; // FOB, CIF, EXW etc (free-form string)
  deliveryMode?: RFQDeliveryMode;

  destinationCountry?: string;
  destinationCity?: string;

  preferredShipWindowStart?: string; // ISO
  preferredShipWindowEnd?: string; // ISO

  paymentPreference?: "escrow" | "bank_transfer" | "lc" | "other";
};

/**
 * RFQ root entity
 */

export type RFQ = {
  id: string;

  title: string;
  description?: string;

  buyer: RFQBuyer;

  products: RFQProductRequest[];
  terms: RFQCommercialTerms;

  priority?: RFQPriority;

  /**
   * Links into other modules
   */
  relatedLotIds?: string[];
  relatedPassportIds?: string[];
  relatedContractIds?: string[];

  status: RFQStatus;

  /**
   * Timestamps
   */
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  openUntil?: string; // ISO (deadline)
};

/**
 * RFQ responses (offers)
 */

export type RFQResponse = {
  id: string;

  rfqId: string;

  cooperative: RFQCooperative;

  /**
   * The cooperative can respond with:
   * - a free-form offer
   * - optionally linking to an existing lot/passport
   */
  message?: string;

  proposedLotId?: string;
  proposedPassportId?: string;

  /**
   * Commercial response
   */
  proposedUnitPrice?: number;
  proposedCurrency?: EscrowCurrency;

  proposedQuantity?: number;
  proposedUnit?: LotUnit;

  attachments?: Array<{
    id?: string;
    url: string;
    label?: string;
    type?: "document" | "lab-report" | "photo" | "other";
  }>;

  status: RFQResponseStatus;

  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

/**
 * Summary views for tables/cards
 */

export type RFQSummary = {
  id: string;
  title: string;

  buyerName: string;
  buyerOrganisation?: string;
  country?: string;

  primaryCategory?: string;

  quantityText?: string;

  currency: EscrowCurrency;
  targetUnitPrice?: number;

  status: RFQStatus;
  priority?: RFQPriority;

  openUntil?: string;

  createdAt: string;
};

export type RFQResponseSummary = {
  id: string;
  rfqId: string;

  cooperativeName: string;
  region?: string;

  proposedUnitPrice?: number;
  proposedCurrency?: EscrowCurrency;

  status: RFQResponseStatus;

  createdAt: string;
};

/**
 * API contracts (client expectations)
 * For MVP these can be handled locally; later moved to functions/backend.
 */

export type CreateRFQPayload = {
  title: string;
  description?: string;

  buyer: RFQBuyer;

  products: RFQProductRequest[];
  terms: RFQCommercialTerms;

  priority?: RFQPriority;
  openUntil?: string;

  status?: RFQStatus; // default draft/open depending on UI
};

export type CreateRFQResponse = {
  rfq: RFQ;
};

export type UpdateRFQPayload = Partial<CreateRFQPayload> & {
  id: string;
  status?: RFQStatus;
};

export type UpdateRFQResponse = {
  rfq: RFQ;
};

export type CreateRFQResponsePayload = {
  rfqId: string;

  cooperative: RFQCooperative;

  message?: string;

  proposedLotId?: string;
  proposedPassportId?: string;

  proposedUnitPrice?: number;
  proposedCurrency?: EscrowCurrency;

  proposedQuantity?: number;
  proposedUnit?: LotUnit;
};

export type CreateRFQResponseResponse = {
  response: RFQResponse;
};

export type UpdateRFQResponsePayload = Partial<CreateRFQResponsePayload> & {
  id: string;
  status?: RFQResponseStatus;
};

export type UpdateRFQResponseResponse = {
  response: RFQResponse;
};

/**
 * Filtering/sorting state for UI
 */

export type RFQFilter = {
  text?: string;

  status?: RFQStatus | "all";
  priority?: RFQPriority | "all";

  category?: string | "all";
  country?: string | "all";

  minTargetPrice?: number;
  maxTargetPrice?: number;

  currency?: EscrowCurrency;
};

export type RFQSort =
  | "newest"
  | "oldest"
  | "deadline_asc"
  | "deadline_desc"
  | "price_asc"
  | "price_desc"
  | "priority";

/**
 * Simple type guards
 */

export function isRFQ(v: unknown): v is RFQ {
  return Boolean(v) && typeof v === "object" && "id" in (v as any) && "buyer" in (v as any);
}

export function isRFQResponse(v: unknown): v is RFQResponse {
  return Boolean(v) && typeof v === "object" && "rfqId" in (v as any) && "cooperative" in (v as any);
}