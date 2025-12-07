// agrotrust-az/src/features/lots/types.ts

/**
 * Lots feature domain types
 *
 * A "Lot" represents an export-ready batch listed by a cooperative.
 * It is the bridge between:
 * - Digital Product Passport (traceability + certifications)
 * - RFQs (buyer demand)
 * - Escrow contracts (trust + payment release)
 *
 * These types are intentionally lightweight and hackathon-friendly.
 */

export type LotStatus =
  | "draft"
  | "listed"
  | "reserved"
  | "in_negotiation"
  | "sold"
  | "archived";

export type ProduceCategory =
  | "tomato"
  | "hazelnut"
  | "persimmon"
  | "pomegranate"
  | "grape"
  | "apple"
  | "other";

export type LotUnit = "kg" | "ton" | "box" | "crate";

export type LotQualityGrade = "A" | "B" | "C" | "Premium" | "Standard";

export type LotCertificationCode =
  | "GlobalG.A.P"
  | "Organic"
  | "HACCP"
  | "ISO_22000"
  | "Halal"
  | "Kosher"
  | "Other";

export type LotCertificationClaim = {
  code: LotCertificationCode | string;
  label?: string; // display label if code is custom
  status?: "claimed" | "pending" | "verified";
  issuer?: string;
  issuedAt?: string; // ISO
  expiresAt?: string; // ISO
  documentUrl?: string;
};

export type LotMedia = {
  id?: string;
  url: string;
  type?: "photo" | "certificate" | "lab-report" | "other";
  label?: string;
};

export type LotLocation = {
  region?: string;
  district?: string;
  addressLine?: string;
  lat?: number;
  lng?: number;
};

export type LotPackaging = {
  type?: string; // e.g., "carton", "plastic crate"
  unitWeightKg?: number; // net per package
  unitsPerPallet?: number;
  notes?: string;
};

export type LotPricing = {
  currency: "USD" | "EUR" | "AZN";
  /**
   * Price per unit (default unit is the lot.unit).
   */
  unitPrice: number;
  /**
   * Optional negotiation band for B2B feel.
   */
  minUnitPrice?: number;
  maxUnitPrice?: number;
  incoterms?: string; // e.g., FOB, CIF
};

export type LotOwner = {
  coopId: string;
  coopName: string;

  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type LotProduct = {
  category: ProduceCategory;
  name: string; // flexible product label for UI
  variety?: string;

  grade?: LotQualityGrade;

  /**
   * Useful for buyer-side filtering
   */
  shelfLifeDays?: number;

  /**
   * Harvest data for listing context
   * (Passport is still the source of truth for full traceability).
   */
  harvestDate?: string; // ISO
};

export type LotInventory = {
  quantity: number;
  unit: LotUnit;

  /**
   * Convenience for weight-based display
   */
  quantityKgApprox?: number;
};

export type Lot = {
  id: string;

  owner: LotOwner;
  product: LotProduct;
  inventory: LotInventory;

  location?: LotLocation;
  packaging?: LotPackaging;
  pricing?: LotPricing;

  certifications?: LotCertificationClaim[];
  media?: LotMedia[];

  /**
   * Link to a Digital Product Passport created for this lot.
   */
  passportId?: string;

  status: LotStatus;

  /**
   * Timestamps
   */
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  listedAt?: string; // ISO
};

/**
 * Buyer-side view models
 */

export type LotSummary = {
  id: string;

  productName: string;
  category: ProduceCategory;
  variety?: string;
  grade?: LotQualityGrade;

  coopName: string;
  region?: string;

  quantity: number;
  unit: LotUnit;

  currency?: LotPricing["currency"];
  unitPrice?: number;

  status: LotStatus;

  passportId?: string;

  createdAt: string; // ISO
};

/**
 * API contracts (client expectations)
 * For hackathon MVP these can be handled locally or via functions later.
 */

export type CreateLotPayload = {
  owner: LotOwner;
  product: LotProduct;
  inventory: LotInventory;

  location?: LotLocation;
  packaging?: LotPackaging;
  pricing?: LotPricing;

  certifications?: LotCertificationClaim[];
  media?: LotMedia[];

  passportId?: string;

  status?: LotStatus;
};

export type CreateLotResponse = {
  lot: Lot;
};

export type UpdateLotPayload = Partial<CreateLotPayload> & {
  id: string;
};

export type UpdateLotResponse = {
  lot: Lot;
};

/**
 * Simple filtering/sorting helpers shapes for UI state
 */

export type LotFilter = {
  text?: string;
  category?: ProduceCategory | "all";
  status?: LotStatus | "all";
  region?: string | "all";
  certification?: string | "all";
  minPrice?: number;
  maxPrice?: number;
  currency?: LotPricing["currency"];
};

export type LotSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "quantity_desc";

/**
 * Utility type guards
 */

export function isLot(value: unknown): value is Lot {
  return Boolean(value) && typeof value === "object" && "id" in (value as any);
}