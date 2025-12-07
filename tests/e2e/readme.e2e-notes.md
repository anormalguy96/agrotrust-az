# AgroTrust AZ - E2E Notes

Purpose
These end-to-end tests are intended to provide fast confidence during the UNEC B2B Hackathon build.
They focus on route-level stability and basic UI presence rather than deep business correctness.

Test scope
1 -Marketing

- Home
- How it works
- Standards
- For farmers
- For buyers
- Contact
- Basic navbar and CTA behaviour

2 - Auth

- Sign in
- Sign up
- Verify email
- Lightweight protected-route checks

3 - Dashboard

- Overview
- Lots
- Cooperatives
- Buyers
- RFQs
- Contracts
- Settings
- Passport and escrow surfaces at smoke level

4 - Optional Netlify Functions checks
These are disabled by default to avoid failing when you run only Vite dev.

Conventions used in this suite

- File suffix: .pw.test.ts
- Location: tests/e2e
- Style: resilient selectors, mostly role-based
- We use soft expectations where a UI block may not be implemented yet

Mock auth approach
For dashboard tests we seed localStorage with:

- agrotrust:auth:token
- agrotrust:auth:user

If your AuthProvider later changes these keys, update the constants in each dashboard-related E2E file.

How to run

1) Install Playwright if you have not already
npm i -D @playwright/test

2) Install browsers
npx playwright install

3) Run E2E tests
npm run test:pw

4) Run with UI
npm run test:pw:ui

Local functions testing (optional)
Netlify Functions are not served by Vite dev.
To test them locally, run Netlify dev and set an environment variable.

Example

```js
NETLIFY_FUNCTIONS_BASE_URL=http://127.0.0.1:8888/.netlify/functions
```

Then run:
npm run test:pw

What will likely change after the hackathon

- Replace mock-auth seeding with a dedicated test login helper.
- Add stable data-testids to critical UI components.
- Add real flow tests:
  - create RFQ -> receive responses -> create contract
  - init escrow -> simulate inspection -> release escrow
  - create passport -> verify passport -> display QR traceability

Troubleshooting

1 - TypeScript shows red import for @playwright/test

- Ensure @playwright/test is installed in this project
- Add a local tsconfig for tests/e2e if needed

2 - Tests fail due to missing headings

- Update regex patterns in the E2E files to match your final copy

3 - Dashboard tests redirect unexpectedly

- Confirm AuthProvider still reads the seeded localStorage keys

Success criteria for judges
This E2E suite is designed to demonstrate:

- disciplined engineering practices
- confidence in core product pathways
- a credible path to production-grade quality gates
