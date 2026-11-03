## Summary

React/TypeScript catalogue and Node/TypeScript API with a replaceable product repository and enquiry sender. Docker Compose starts the app and a local Mailpit inbox without accounts or secrets.

## Acceptance Coverage

- Exactly five configurable editorial products on home.
- Three rating-ranked category highlights plus remaining category products.
- Case-insensitive literal text search, empty state and product details.
- Validated enquiry form; actual SMTP email before the thank-you state.
- Desktop/mobile layouts, failure states and keyboard focus restoration.

## Verification

Local verification: strict type check, ESLint, 21 unit/API/adapter tests, production build and 10 Chromium desktop/mobile E2E tests, including received email assertions in Mailpit. Cache tests cover reuse across browse/search/details, concurrent fetches and the five-minute expiry boundary. See README for commands and AI_USAGE.md for mistakes found and time spent. CI is configured; its hosted run must be checked after publishing.

## Key Decisions

See DECISIONS.md. Editorial selection is configuration rather than a new admin product. Category highlights use the API ratings. No database or email queue was added for this PoC. Product metadata never comes directly from Fake Store to the browser.

## Known Limitations

Mailpit captures locally and does not prove external deliverability. Enquiries are not durably stored or idempotent. Throttling/cache are process-local. Public deployment needs TLS, production email, abuse controls and a privacy/retention policy. Mobile coverage is viewport emulation, not physical-device certification.

## Candidate Sign-Off Before Submission

- [ ] I have read and can explain every submitted source file.
- [ ] I have personally run the critical path and recorded my own time.
- [ ] I have reviewed AI_USAGE.md and DECISIONS.md for accuracy.
- [ ] CI is green and reviewers have repository access.
- [ ] This PR targets main and will remain open for assessment.