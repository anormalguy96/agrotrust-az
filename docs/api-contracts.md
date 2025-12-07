# AgroTrust AZ — API Contracts (MVP)

This document defines the lightweight API boundaries for the hackathon MVP.

The objective is not to perfectly mirror production-grade agritech or customs systems, but to provide a consistent interface that demonstrates the core story:

- Digital traceability and quality assurance.
- Buyer confidence through verifiable passports.
- Reduced dependency on middlemen.
- Escrow-inspired trust for cross-border trade.

The MVP uses Netlify Functions as a serverless backend. These functions can run in mock mode using JSON files or in-memory stores.

## Base URL

During local or Netlify dev:

- /.netlify/functions

In production, the same path applies unless overridden.

The frontend HTTP helper defaults to this value.

## Response Envelope

All functions return an envelope of:

    {
      "ok": true,
      "data": {},
      "meta": {
        "requestId": "optional",
        "ts": "2025-12-06T00:00:00.000Z"
      }
    }

On error:

    {
      "ok": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Human-friendly message",
        "details": {}
      },
      "meta": {
        "requestId": "optional",
        "ts": "2025-12-06T00:00:00.000Z"
      }
    }

See src/types/api.ts for the full shared type model.

## Functions

### 1) Health

Purpose

Confirms that the backend layer is reachable.

Route

- GET /.netlify/functions/health

Response

Returns service status and execution time.

### 2) Create Passport

Purpose

Creates a Digital Product Passport for a lot or future lot.

Route

- POST /.netlify/functions/passport-create

Request shape (MVP)

    {
      "lotId": "LOT-0001",
      "coopId": "COOP-0001",
      "productName": "Tomato",
      "category": "tomato",
      "variety": "Cherry",
      "harvestDate": "2025-11-21",
      "origin": {
        "country": "Azerbaijan",
        "region": "Lankaran",
        "farmName": "Green Valley"
      },
      "inputs": {
        "fertiliser": ["NPK 10-10-10"],
        "pesticides": ["Demo-safe bio spray"]
      },
      "photos": [],
      "certifications": [
        { "code": "GlobalG.A.P", "label": "GlobalG.A.P" }
      ],
      "timeline": [
        {
          "at": "2025-11-21T08:15:00.000Z",
          "actor": "farmer",
          "action": "harvest_logged"
        }
      ]
    }

Response shape

    {
      "ok": true,
      "data": {
        "passport": {
          "id": "PP-0001",
          "lotId": "LOT-0001",
          "coopId": "COOP-0001"
        },
        "qrPayload": "agrotrust:passport:PP-0001"
      }
    }

MVP notes

- A real system would integrate GlobalG.A.P registries and lab inspection results.
- The MVP focuses on a clear trust narrative for judges.

### 3) Verify Passport

Purpose

Allows buyers to verify passport authenticity and view traceability.

Route

- POST /.netlify/functions/passport-verify

Request

    {
      "passportId": "PP-0001"
    }

Or:

    {
      "qrPayload": "agrotrust:passport:PP-0001",
      "buyerId": "BUY-0001"
    }

Response

    {
      "ok": true,
      "data": {
        "valid": true,
        "passport": {
          "id": "PP-0001",
          "productName": "Tomato"
        }
      }
    }

If invalid:

    {
      "ok": true,
      "data": {
        "valid": false,
        "reasons": [
          "Passport not found",
          "QR payload malformed"
        ]
      }
    }

### 4) Init Escrow

Purpose

Simulates a smart-contract-like escrow deposit for cross-border deals.

Route

- POST /.netlify/functions/escrow-init

Request

    {
      "rfqId": "RFQ-0001",
      "lotId": "LOT-0001",
      "buyerId": "BUY-0001",
      "coopId": "COOP-0001",
      "amount": 24000,
      "currency": "USD",
      "inspection": {
        "authority": "Border Inspection Service",
        "location": "Baku logistics hub",
        "expectedBy": "2025-12-15"
      },
      "releaseCondition": "Release after inspection pass at border"
    }

Response

    {
      "ok": true,
      "data": {
        "escrowId": "ESC-0001",
        "status": "funded",
        "fundedAmount": 24000,
        "currency": "USD",
        "createdAt": "2025-12-06T00:00:00.000Z"
      }
    }

MVP notes

- This is a trust demo, not a blockchain implementation.
- The frontend can show escrow timelines and state progression.

### 5) Release Escrow

Purpose

Simulates release of funds to the cooperative after inspection.

Route

- POST /.netlify/functions/escrow-release

Request

    {
      "escrowId": "ESC-0001",
      "inspectionPassed": true,
      "inspectionReportUrl": "https://example.com/demo-report.pdf",
      "notes": "Cargo verified at border"
    }

Response

    {
      "ok": true,
      "data": {
        "escrowId": "ESC-0001",
        "status": "released",
        "releasedAmount": 24000,
        "currency": "USD",
        "releasedAt": "2025-12-06T00:00:00.000Z"
      }
    }

## Data Sources (MVP)

For the hackathon demo, you can load mocks from:

- public/mock/sample-lots.json
- public/mock/sample-coops.json
- public/mock/sample-buyers.json

The functions may read these files or use equivalent static objects in code.

## Security & Authentication (MVP)

For speed and clarity:

- Use a lightweight “mock auth” flow in the frontend.
- Store a demo token in localStorage.
- Protect dashboard routes using ProtectedRoute.

Real-world extensions would include:

- OAuth for enterprise buyers.
- Role-based access control.
- Audit logs for passport verifications.

## Future Extensions (Post-hackathon)

Potential credible upgrades:

- Link certifications to real issuer registries.
- Add a customs or border inspection admin portal.
- Integrate document uploads (lab results, phytosanitary checks).
- Connect structured RFQ to offer to contract to escrow flows.
- Add multilingual support for export corridors (AZ/RU/EN/AR).

## Quick QA Checklist

Before the demo, confirm:

- Health endpoint returns OK.
- Passport create returns a QR payload.
- Passport verify displays traceability timeline.
- Escrow init creates a mock funded state.
- Escrow release moves state to released.
- UI handles empty states gracefully.

## Change Log

- 2025-12-06: Initial MVP contract draft.
