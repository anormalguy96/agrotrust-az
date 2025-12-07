# AgroTrust AZ — User Flows (MVP)

This document describes the main user journeys for the AgroTrust AZ hackathon MVP. The flows follow a traditional export logic that stakeholders already understand, while adding a modern digital trust layer through passports, certification signals, and escrow-style payments.

The MVP emphasises clarity over complexity. Each flow can be demonstrated using mock data and Netlify Functions.

Section 1. Roles overview

Guest

- Can browse marketing pages.
- Can view the general value proposition.
- Cannot access the dashboard.

Farmer or Cooperative user

- Can access the dashboard.
- Can view lots, passports, and certification status in demo mode.
- Can initiate passport creation for a lot.

Buyer user

- Can access the dashboard.
- Can browse lots.
- Can view and filter RFQs.
- Can verify passports and review certifications.
- Can initiate escrow in demo mode.

Admin user

- Can access all dashboard areas in the MVP.
- Can simulate verification states for passports and certifications.
- Can trigger escrow release in demo mode.

Section 2. Flow A — Cooperative creates a lot and a digital product passport

Goal
Enable a cooperative to present export-ready produce with traceability evidence.

Entry points

- Dashboard Lots page
- Dashboard Overview quick action

Steps

1) Cooperative user opens Lots.
2) User reviews existing lots from mock data.
3) User selects a lot or creates a new demo lot (if this action is enabled in your UI).
4) User chooses Create passport.
5) The passport form captures:
   - product name, category, variety
   - harvest date
   - origin details (country, region, farm name)
   - fertiliser and pesticide notes
   - optional photos
6) The app sends a request to the passport-create function.
7) The function returns:
   - a passport object
   - a QR payload
8) The UI displays:
   - Passport preview
   - Traceability timeline
   - QR visual
9) The lot card or lots table shows a visual indicator that a passport exists.

Success criteria for demo

- A new passport ID is generated and visible.
- QR is displayed.
- Timeline shows at least one meaningful event.

Section 3. Flow B — Certification request and verification signal

Goal
Show how export-grade standards can be attached to a cooperative, lot, or passport.

Entry points

- Lots detail view
- Passport preview area
- Certifications list or card placements

Steps

1) Cooperative user opens a lot or passport.
2) User sees a prompt indicating recommended or required standards.
3) User selects a standard such as GlobalG.A.P or Organic.
4) User submits a demo request.
5) The UI records a CertificationRecord mock in a requested or pending_review state.
6) An admin user can move status to verified to simulate approval.
7) The UI updates:
   - CertificationCard shows a verified state.
   - Passport preview reflects the standard badge.
   - The buyer-facing screens display stronger trust signals.

Success criteria for demo:

- Certification status visibly changes.
- The passport and lot surfaces reflect certification references.

Section 4. Flow C — Buyer verifies a passport via QR or ID

Goal
Provide the buyer with confidence that the origin and handling history are credible.

Entry points

- Marketing Standards page (conceptual)
- Dashboard Lots page
- A dedicated verify action inside the passport feature

Steps

1) Buyer opens a lot card or lots table.
2) Buyer selects View passport or Verify passport.
3) Buyer either:
   - scans a QR in the demo narrative
   - enters a passport ID
4) The app sends a request to the passport-verify function.
5) The function returns:
   - valid: true or false
   - passport data when available
   - reasons when invalid
6) The UI shows:
   - a clear valid or invalid state
   - key origin information
   - timeline and certifications

Success criteria for demo

- The verify action returns a clean success state.
- The UI communicates trust with minimal ambiguity.

Section 5. Flow D — Buyer creates an RFQ and receives offers

Goal
Show structured demand that invites competitive supply.

Entry points

- Dashboard RFQs page

Steps

1) Buyer opens RFQs.
2) Buyer reviews existing mock RFQs.
3) Buyer creates a new demo RFQ with:
   - product requirement
   - target price and currency
   - quantity and unit
   - required certification codes (optional)
   - open-until date (optional)
4) The RFQ appears in the list.
5) In the demo narrative, cooperative responses are loaded from mock data or created via a local action.
6) Buyer views offers in RFQResponsesList.

Success criteria for demo

- The RFQ list shows filtering and sorting.
- Offers display proposed lot and passport references where available.

Section 6. Flow E — Escrow-style trust payment

Goal
Demonstrate reduced risk in cross-border transactions.

Entry points

- RFQ offers section
- Contracts page
- A dedicated escrow widget

Steps

1) Buyer selects a cooperative offer.
2) Buyer initiates escrow.
3) The app sends a request to escrow-init with:
   - buyer ID
   - cooperative ID
   - amount and currency
   - optional inspection metadata
4) The function returns a funded escrow state.
5) The UI displays:
   - EscrowStatus
   - EscrowTimeline
6) Admin simulates inspection pass.
7) Admin triggers escrow release.
8) The app sends a request to escrow-release.
9) The UI updates to released.

Success criteria for demo

- Two-step init and release is visible.
- The timeline tells a coherent trust story.

Section 7. Flow F — End-to-end narrative for judges

Recommended demo sequence

1) Show a cooperative and a lot.
2) Create a passport and show the QR plus timeline.
3) Attach or display a certification signal.
4) Switch to the buyer view.
5) Verify that passport.
6) Open an RFQ and show responses.
7) Initiate escrow for a selected offer.
8) Release escrow after simulated inspection.

This sequence aligns strongly with the non-oil export priority theme and highlights trust, compliance, and fair margin access.

Section 8. Out-of-scope for MVP

These can be mentioned as extensions without implementation:

- Full KYC and role-based enterprise onboarding.
- Live integration with certification registries.
- Border authority back-office interfaces.
- Smart contract deployment on a blockchain network.
- Real document storage and secure evidence workflows.

Section 9. UI components that support these flows

Marketing

- Home
- How it works
- Standards
- For farmers
- For buyers
- Contact

Dashboard

- Overview
- Lots and lot details
- Cooperatives
- Buyers
- RFQs
- Contracts
- Settings

Feature building blocks

- PassportPreview
- PassportQR
- TraceabilityTimeline
- LotCard
- LotsTable
- CertificationCard
- CertificationFilters and CertificationList
- RFQCard
- RFQFilters
- RFQList
- RFQResponsesList
- EscrowStatus
- EscrowTimeline
