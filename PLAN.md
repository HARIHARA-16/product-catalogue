# Implementation Plan

1. Establish React/Node TypeScript tooling and one-command Docker startup.
2. Implement catalogue use cases behind a ProductRepository, then HTTP routes.
3. Implement validated enquiries behind an EnquirySender and SMTP adapter.
4. Build responsive browse, category, search, product and enquiry views.
5. Verify, review and document decisions, limitations and actual AI usage.

## Testing Strategy

- Application: React SPA plus Node HTTP API; greenfield, no legacy tests.
- Unit/API: Vitest and Supertest with injected product and mail fakes. Cover five featured IDs, category ranking/additional products, case-insensitive search, details/not-found, validation, upstream failures and email failure/success.
- Adapter contract: validate Fake Store payloads at the backend boundary; exercise malformed payload and cache behavior with mocked fetch.
- Integration: Docker Compose app plus real Mailpit SMTP. Confirm successful submission actually appears in the inbox.
- Browser: Playwright against the running app with deterministic product fixtures at the backend boundary. Cover home, category, search, detail, enquiry and mobile overflow. No browser interception of product requests.
- Primary environment: Docker daemon, Node/npm, Chromium. Infrastructure fallback: local Node with SMTP available separately; browser fallback: API tests only, explicitly report missing visual coverage.
- Isolated test data: in-memory products for unit/API tests; explicit fixture mode for repeatable browser tests. No production data or paid accounts.
- Pass: checks/build and critical journeys succeed; successful enquiry appears in Mailpit; failed sends never show thanks. Review desktop/mobile screenshots and error states.