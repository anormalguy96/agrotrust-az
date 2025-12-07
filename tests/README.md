# AgroTrust AZ - Tests

This folder contains unit and end-to-end checks for the AgroTrust AZ MVP. The goal is to keep quality signals visible and lightweight for hackathon speed, while still reflecting production-minded structure.

What is inside

Unit tests
Location: tests/unit
These focus on small, deterministic utilities and service wrappers. They should run fast and require no browser.

Current unit coverage targets

* format helpers
* validators
* QR helpers
* storage wrapper
* HTTP wrapper

End-to-end tests
Location: tests/e2e
These use Playwright and focus on route-level and UI smoke coverage for marketing, auth, and dashboard surfaces. They are intentionally resilient and use role-based selectors where possible.

Mock auth in E2E

Most dashboard E2E tests seed localStorage with two keys.

* agrotrust:auth:token
* agrotrust:auth:user

If you later change your AuthProvider storage keys, update the constants inside the E2E files.

How to run unit tests

If your package.json includes a unit test script, run it with npm.
Otherwise you can run Vitest directly.

Examples
npm run test
or
npx vitest

How to run E2E tests

Install Playwright as a dev dependency and install browsers if you have not already.

npm.cmd i -D @playwright/test
npx playwright install

Then run E2E tests using your script if you added one:

npm run test:pw

If you did not add scripts yet:

npx playwright test

Local Netlify Functions E2E (optional)

The optional functions smoke test is gated by an environment variable so it does not fail when you run only Vite dev.

Set this when you run Netlify dev:

NETLIFY_FUNCTIONS_BASE_URL=[http://127.0.0.1:8888/.netlify/functions](http://127.0.0.1:8888/.netlify/functions)

Then run your Playwright tests.

Notes for judges

This testing setup is meant to demonstrate:

* credible engineering discipline
* confidence in core MVP pathways
* a clean path towards deeper automation after the hackathon

Next file to continue with

agrotrust-az/tests/unit/analytics.test.ts
