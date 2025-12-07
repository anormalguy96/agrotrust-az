// agrotrust-az/src/features/escrow/types.ts

/**
 * Escrow feature types
 *
 * This hackathon MVP models a simple, trust-building flow:
 * - Buyer deposits funds into escrow
 * - Cargo is inspected at border/hand-over checkpoint
 * - Funds are released to the cooperative/farmer
 *
 * The real-world version would integrate licensed payment providers,
 * customs/inspection APIs, and audit-grade event logs.
 */

export type EscrowCurrency = "USD" | "EUR" | "AZN";

export type EscrowStatus =
  | "draft"
  | "awaiting_deposit"
  | "funded"
  | "in_transit"
  | "inspection_pending"
  | "inspection_passed"
  | "inspection_failed"
  | "released"
  | "refunded"
  | "cancelled";

export type EscrowPartyRole = "buyer" | "seller" | "inspector" | "admin";

export type EscrowParty = {
  id?: string;
  role: EscrowPartyRole;
  name: string;
  organisation?: string;
  email?: string;
  phone?: string;
  country?: string;
};

export type EscrowMilestoneType =
  | "contract_created"
  | "deposit_requested"
  | "deposit_received"
  | "shipment_dispatched"
  | "shipment_arrived"
  | "inspection_started"
  | "inspection_passed"
  | "inspection_failed"
  | "release_requested"
  | "released"
  | "refund_requested"
  | "refunded"
  | "cancelled"
  | "custom";

export type EscrowMilestone = {
  id?: string;
  type: EscrowMilestoneType;
  title?: string;
  description?: string;
  date: string; // ISO
  actor?: Pick<EscrowParty, "role" | "name" | "organisation">;
  evidenceUrls?: string[];
};

export type EscrowInspection = {
  required?: boolean;
  providerName?: string;
  location?: string;
  scheduledAt?: string; // ISO
  completedAt?: string; // ISO
  result?: "pending" | "passed" | "failed";
  notes?: string;
  reportUrl?: string;
};

export type EscrowAmounts = {
  amount: number;
  currency: EscrowCurrency;
  feeAmount?: number;
  netAmount?: number;
};

export type EscrowContract = {
  id: string;

  /**
   * Marketplace linkage
   */
  lotId?: string;
  passportId?: string;
  rfqId?: string;

  buyer?: EscrowParty;
  seller?: EscrowParty;

  /**
   * Commercial terms (lightweight for MVP)
   */
  productName?: string;
  quantityKg?: number;
  incoterms?: string; // e.g., FOB, CIF (optional demo string)
  destinationCountry?: string;

  amounts: EscrowAmounts;

  status: EscrowStatus;

  inspection?: EscrowInspection;

  milestones?: EscrowMilestone[];

  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

/**
 * API contracts (client expectations)
 * Aligns with Netlify Functions:
 * - escrow-init
 * - escrow-release
 */

export type InitEscrowPayload = {
  lotId?: string;
  passportId?: string;
  rfqId?: string;

  buyer?: EscrowParty;
  seller?: EscrowParty;

  productName?: string;
  quantityKg?: number;
  destinationCountry?: string;
  incoterms?: string;

  amount: number;
  currency?: EscrowCurrency;

  /**
   * MVP flags
   */
  requireInspection?: boolean;
};

export type InitEscrowResponse = {
  contract: EscrowContract;

  /**
   * Demo-friendly payment instructions.
   * In production this would be a payment intent id or bank reference.
   */
  depositReference?: string;
  depositUrl?: string;
};

export type ReleaseEscrowPayload = {
  contractId: string;

  /**
   * For MVP, the release reason is optional,
   * but useful for timeline messaging.
   */
  reason?: string;

  /**
   * If present, simulates inspection outcome.
   */
  inspectionResult?: "passed" | "failed";
};

export type ReleaseEscrowResponse = {
  contract: EscrowContract;
  releasedAt?: string; // ISO
};

/**
 * Verification/diagnostic shapes useful in UI
 */

export type EscrowIssue = {
  code: string;
  message: string;
  severity?: "low" | "medium" | "high";
};

export type EscrowSummary = {
  id: string;
  lotId?: string;
  passportId?: string;

  buyerName?: string;
  sellerName?: string;

  amount: number;
  currency: EscrowCurrency;

  status: EscrowStatus;

  createdAt: string;
};

/**
 * Small helper unions for components
 */

export type EscrowTimelineItem = EscrowMilestone & {
  displayDate?: string;
  tone?: "muted" | "info" | "success" | "warning" | "danger";
};