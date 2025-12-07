// agrotrust-az/src/types/domain.ts

/**
 * Shared domain types for AgroTrust AZ.
 *
 * Intent:
 * - Provide lightweight, cross-feature primitives.
 * - Avoid circular imports between feature type modules.
 * - Keep hackathon MVP flexible whilst still typed.
 *
 * Feature modules (lots/passport/certification/rfq/escrow)
 * can extend these base types locally.
 */

/* ---------------------------------- */
/* IDs & primitives                    */
/* ---------------------------------- */

export type ID = string;

export type CoopId = ID;
export type BuyerId = ID;
export type LotId = ID;
export type PassportId = ID;
export type CertificationId = ID;
export type RFQId = ID;
export type RFQResponseId = ID;
export type EscrowId = ID;
export type ContractId = ID;

export type ISODateString = string;

/**
 * Core measurement units used across produce trade.
 * You can extend this list later without breaking callers.
 */
export type Unit =
  | "kg"
  | "g"
  | "ton"
  | "crate"
  | "box"
  | "pallet"
  | "unit";

/**
 * Currency codes used in the MVP.
 * Keep string fallback to avoid over-restriction in demos.
 */
export type Currency = "USD" | "EUR" | "AZN" | (string & {});

/**
 * Produce categories relevant to Azerbaijan's export profile,
 * plus a safe "other".
 */
export type CommodityCategory =
  | "tomato"
  | "hazelnut"
  | "persimmon"
  | "pomegranate"
  | "grape"
  | "apple"
  | "cucumber"
  | "potato"
  | "onion"
  | "other";

/* ---------------------------------- */
/* Actors                              */
/* ---------------------------------- */

export type UserRole = "guest" | "farmer" | "buyer" | "admin";

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  role: UserRole;

  organisationId?: ID;
  organisationName?: string;

  verifiedEmail?: boolean;

  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface Cooperative {
  id: CoopId;
  name: string;

  region?: string;
  address?: string;

  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  membersCount?: number;

  verified?: boolean;
  tags?: string[];

  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface BuyerOrganisation {
  id: BuyerId;
  name: string;

  organisation?: string; // company/group name (if different from contact name)

  country?: string;
  city?: string;
  address?: string;

  email?: string;
  phone?: string;

  verified?: boolean;
  tags?: string[];

  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/* ---------------------------------- */
/* Products & quality                  */
/* ---------------------------------- */

export interface CertificationRef {
  id?: CertificationId;
  code: string; // e.g., GlobalG.A.P, Organic, HACCP
  label?: string;
  required?: boolean;

  issuerName?: string;

  issuedAt?: ISODateString;
  expiresAt?: ISODateString;
}

export interface TraceabilityEntry {
  at: ISODateString;
  actor?: string; // farmer, coop manager, inspector
  action: string; // "harvest_logged", "cold_storage_started", etc.
  notes?: string;
  mediaUrls?: string[];
}

export interface DigitalProductPassport {
  id: PassportId;
  lotId?: LotId;
  coopId?: CoopId;

  productName?: string;
  category?: CommodityCategory;
  variety?: string;

  harvestDate?: ISODateString;

  origin?: {
    country?: string;
    region?: string;
    farmName?: string;
    geoHint?: string; // non-sensitive, high-level description
  };

  inputs?: {
    fertiliser?: string[];
    pesticides?: string[];
    irrigationNotes?: string;
  };

  photos?: string[];

  certifications?: CertificationRef[];

  timeline?: TraceabilityEntry[];

  qrPayload?: string; // data encoded behind QR

  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/* ---------------------------------- */
/* Commercial primitives               */
/* ---------------------------------- */

export interface PriceBand {
  currency: Currency;
  targetUnitPrice?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
}

export interface Quantity {
  amount: number;
  unit: Unit;
  quantityKgApprox?: number; // for mixed units in comparisons
}

/* ---------------------------------- */
/* Utility helpers (types)            */
/* ---------------------------------- */

export type WithId<T> = T & { id: ID };

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * A simple async state shape you can reuse in hooks.
 */
export type AsyncState<T> = {
  data?: T;
  loading: boolean;
  error?: string | null;
};