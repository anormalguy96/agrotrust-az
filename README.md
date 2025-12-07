# AgroTrust AZ

AgroTrust AZ is a hackathon MVP for a B2B quality certification and export marketplace designed to help Azerbaijani farmer cooperatives connect directly with foreign buyers. The platform demonstrates how digital traceability, recognised standards, and escrow-style trust can reduce overreliance on middlemen and improve export readiness.

This repository contains a Vite + React + TypeScript frontend and a lightweight Netlify Functions backend, supported by mock datasets for a smooth, reliable demo.

## What this MVP demonstrates

- A B2B marketplace narrative centred on Azerbaijan’s non-oil agricultural exports.
- Digital Product Passports (QR-verifiable traceability records).
- Certification signals (mocked workflows for GlobalG.A.P, Organic, HACCP, etc.).
- RFQ and cooperative response flows.
- Escrow-style payment trust simulation tied to inspection outcomes.
- Role-aware dashboard routes with a simple auth layer.

## Why this matters

Export buyers increasingly require proof of origin, handling, and quality standards. Many small and mid-sized producers struggle to present these signals clearly and therefore lose margin to intermediaries.

AgroTrust AZ showcases a structured, modern trust layer that fits the traditional realities of agricultural trade: lots, batches, standards, and inspection points.

## Tech stack

Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query

Backend (MVP)

- Netlify Functions (TypeScript)
- Mock-first API contracts

## Local development

1) Install dependencies

    npm install

2) Create your local environment file

    Copy .env.example to .env and adjust if needed.

3) Run the frontend

    npm run dev

4) Run with Netlify Functions locally (recommended)

    npm run netlify:dev

If you do not have a Netlify CLI script yet, you can add one later in package.json or install the CLI globally. The MVP is designed to still work in a mock-only mode for UI demonstration.

## Environment variables

The MVP keeps env minimal. Your .env.example may include items similar to:

- VITE_APP_NAME
- VITE_ENV
- VITE_ENABLE_MOCKS
- VITE_ENABLE_ANALYTICS

The frontend reads configuration through src/app/config/env.ts to keep imports consistent.

## Key routes

Marketing

- /
- /how-it-works
- /standards
- /for-farmers
- /for-buyers
- /contact

Dashboard

- /dashboard
- /dashboard/lots
- /dashboard/cooperatives
- /dashboard/buyers
- /dashboard/rfqs
- /dashboard/contracts
- /dashboard/settings

## Backend functions

Base path:

- /.netlify/functions

Functions:

- health
- passport-create
- passport-verify
- escrow-init
- escrow-release

The contracts and example payloads are documented in:

- docs/api-contracts.md

## Mock data

The demo loads sample datasets from:

- public/mock/sample-lots.json
- public/mock/sample-coops.json
- public/mock/sample-buyers.json

Feature-level mocks may also exist inside:

- src/features/*/mock.ts

## Project structure (high level)

    agrotrust-az/
    ├── netlify/functions/
    ├── public/mock/
    ├── src/
    │   ├── app/               App shell, router, providers, guards, config
    │   ├── layouts/           Marketing and dashboard layouts
    │   ├── pages/             Route-level screens
    │   ├── components/        Shared UI blocks and form fields
    │   ├── features/          Passport, Lots, Certification, RFQ, Escrow
    │   ├── services/          http, storage, analytics
    │   ├── utils/             format, validators, qr
    │   └── types/             domain and api contracts
    └── docs/                  pitch, user flows, data model, api contracts

## Demo narrative

A judge-friendly sequence:

1) A cooperative lists or opens a lot.
2) The cooperative creates a Digital Product Passport.
3) The passport shows traceability and a QR.
4) A certification signal is visible on the passport or lot.
5) A buyer verifies the passport.
6) The buyer reviews an RFQ and cooperative offers.
7) The buyer initiates escrow.
8) The escrow is released after simulated inspection.

## Limitations of the MVP

This build is intentionally lightweight:

- Certification issuer workflows are simulated.
- Escrow is a trust demonstration, not a blockchain deployment.
- Authentication is mock-first for speed.
- Data persistence may be in-memory or browser-based.

These constraints are appropriate for a hackathon environment and provide a credible path to production-grade expansion.

## Future improvements

- Real integrations with certification registries.
- Evidence uploads and stronger audit trails.
- Border inspection admin portal.
- Structured contract generation.
- Multi-language export corridor support.

## Licence

MIT. See LICENSE.

## Maintainers

This project is prepared as a hackathon-ready MVP and can be extended into a production prototype with minimal architectural change.
