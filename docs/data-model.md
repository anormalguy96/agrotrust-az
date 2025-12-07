# AgroTrust AZ — Data Model (MVP)

This document outlines the core data entities and relationships for the AgroTrust AZ hackathon MVP. The model is deliberately pragmatic: it reflects how agricultural trade and compliance have traditionally operated (with clear paperwork, batches, and inspection checkpoints) while providing a forward-looking digital layer that improves traceability, verification, and cross-border trust.

The MVP is designed to work with mock JSON and lightweight in-app state. The same structure can later be mapped to a relational database, document store, or hybrid architecture without major refactoring.

## Core entities

### 1) User

A minimal identity used for authentication and role-based access in the dashboard.

Key fields:

- id
- name
- email
- role: guest, farmer, buyer, admin
- organisationId, organisationName (optional)
- verifiedEmail (optional)
- createdAt, updatedAt (optional)

### 2) Cooperative

A structured representation of farmer groups or mid-sized farms that can supply lots and apply for certifications.

Key fields:

- id
- name
- region, address (optional)
- contactName, contactEmail, contactPhone (optional)
- membersCount (optional)
- verified (optional)
- tags (optional)
- createdAt, updatedAt (optional)

### 3) BuyerOrganisation

Represents the foreign or regional procurement side.

Key fields:

- id
- name
- organisation (optional)
- country, city, address (optional)
- email, phone (optional)
- verified (optional)
- tags (optional)
- createdAt, updatedAt (optional)

### 4) Lot

A commercial and traceability anchor. A lot is a batch of produce offered for sale, typically tied to a cooperative and one or more quality signals.

Expected MVP fields (from feature types):

- id
- title or productName
- category, variety (optional)
- coopId, coopName
- quantity, unit
- price or targetPrice, currency (optional)
- harvestDate (optional)
- storageType, location, logistics notes (optional)
- passports: a reference list or derived link
- certifications: a reference list or derived link
- status: available, reserved, sold, expired (or equivalent MVP enum)
- createdAt, updatedAt

### 5) Digital Product Passport

A digital representation of origin, inputs, timeline, and compliance references. This is what buyers verify via QR.

Key fields:

- id
- lotId (optional in early stage)
- coopId
- productName
- category, variety (optional)
- harvestDate (optional)
- origin: country, region, farmName, geoHint (optional)
- inputs: fertiliser list, pesticides list, irrigation notes (optional)
- photos (optional)
- certifications: array of CertificationRef
- timeline: array of TraceabilityEntry
- qrPayload (optional)
- createdAt, updatedAt

### 6) Certification

In the MVP, certifications can be represented at two levels.

CertificationRef (embedded or referenced):

- id (optional)
- code: GlobalG.A.P, Organic, HACCP, ISO_22000, Halal, etc.
- label (optional)
- issuerName (optional)
- issuedAt, expiresAt (optional)
- required (optional)

CertificationRecord (full record in certification feature):

- id
- standard: code, label
- applicant: coopId, coopName
- scope: lotId, passportId, coopId (optional combinations)
- issuer: name (optional)
- status: draft, requested, pending_review, verified, rejected, expired, revoked
- issuedAt, expiresAt (optional)
- notes, evidenceUrls (optional)
- createdAt, updatedAt

### 7) RFQ

A buyer-side request describing demand, quality requirements, and commercial terms.

Key fields:

- id
- title
- description (optional)
- buyer: buyerId, name, country, organisation (optional)
- products: name, category, variety, requiredCertCodes (optional)
- terms: targetUnitPrice, currency, quantity, unit
- openUntil (optional)
- status: draft, open, shortlisting, negotiation, awarded, closed, cancelled
- priority: high, medium, low
- createdAt, updatedAt

### 8) RFQResponse

A cooperative offer against an RFQ.

Key fields:

- id
- rfqId
- cooperative: id, name, region, verified (optional)
- proposedLotId (optional)
- proposedPassportId (optional)
- proposedQuantity, proposedUnit
- proposedUnitPrice, proposedCurrency
- message (optional)
- attachments (optional)
- status: submitted, updated, shortlisted, accepted, rejected, withdrawn
- createdAt, updatedAt

### 9) Escrow

A trust-building transaction object tied to deals that require inspection-based release.

Key fields:

- escrowId
- buyerId
- coopId
- rfqId (optional)
- lotId (optional)
- amount, currency
- status: draft, funded, in_inspection, released, refunded, disputed
- inspection: authority, location, expectedBy (optional)
- releaseCondition (optional)
- createdAt
- releasedAt (optional)

### 10) Contract

This may be a lightweight record in the MVP and expanded later.

Key fields:

- id
- buyerId
- coopId
- rfqId (optional)
- lotId
- passportId (optional)
- agreedQuantity, unit
- agreedUnitPrice, currency
- escrowId (optional)
- status: draft, signed, in_fulfilment, completed, terminated
- createdAt, updatedAt

## Relationships

The model follows a straightforward chain that mirrors real-world agricultural trade, with a digital verification overlay.

- A Cooperative can create many Lots.
- A Lot can have zero or one primary Digital Product Passport in the MVP, but the model can evolve to support multiple passports or versions.
- A Digital Product Passport references many traceability entries and may reference one or more certifications.
- A Certification can be scoped to a Cooperative, a Lot, or a Passport.
- A BuyerOrganisation can create many RFQs.
- An RFQ can receive many RFQResponses from different cooperatives.
- An RFQResponse may reference a proposed Lot and Passport.
- A Contract may be created from an RFQ and an accepted RFQResponse.
- An Escrow can be tied to a Contract, and optionally linked back to the RFQ and Lot for audit clarity.

## Suggested ID conventions

These are purely to keep the demo readable.

- COOP-0001
- BUY-0001
- LOT-0001
- PP-0001
- CERT-0001
- RFQ-0001
- RSP-0001
- ESC-0001
- CTR-0001

## Status alignment

To keep UI logic consistent, the MVP should treat statuses as display and filtering primitives rather than strict workflow engines.

Lots: available, reserved, sold, expired  
Passports: active, superseded (optional future)  
Certifications: draft, requested, pending_review, verified, rejected, expired, revoked  
RFQ: draft, open, shortlisting, negotiation, awarded, closed, cancelled  
RFQResponse: submitted, updated, shortlisted, accepted, rejected, withdrawn  
Escrow: draft, funded, in_inspection, released, refunded, disputed  
Contract: draft, signed, in_fulfilment, completed, terminated

## MVP storage approach

For the hackathon, the quickest path is:

- Frontend loads base entities from public/mock JSON.
- Feature APIs can maintain an in-memory store for create and update actions.
- Netlify functions can return deterministic, typed envelopes matching src/types/api.ts.

This arrangement keeps the demo stable while showing a credible path towards a production-grade data backbone.

## Future-ready extensions

The model is intentionally open for upgrades that are common in export-heavy food supply chains.

- Versioned passports with immutable audit trails.
- Real issuer registry synchronisation for GlobalG.A.P and Organic standards.
- Lot-level lab test results and phytosanitary documentation.
- Customs checkpoint events as additional traceability entries.
- Structured contract clauses and partial escrow releases.
- Multi-language data dictionaries for export corridors.
