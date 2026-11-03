# Decisions and assumptions

## Acceptance criteria

| Topic | Decision |
| --- | --- |
| Home featured products | Five owner-selected IDs, not the global highest ratings. Default: `1,5,9,16,19`. IDs must be distinct and present; missing selections return an error. |
| Category highlights | Top three by rating, with product ID as the tie-break. Remaining products appear below without duplicates. |
| Search | Trimmed, case-insensitive substring matching over title, description and category. No fuzzy search; empty queries show all products. |
| Prices | Display Fake Store prices in USD. No stock, tax, shipping or checkout promises. |
| Enquiry form | Name, email and a 10-2000 character message required; phone optional. Server validation is authoritative. |
| Email success | Show thanks only after SMTP accepts the message. This does not prove delivery to an external inbox. |
| Recipient | Server-configured sales inbox. Customer email is Reply-To, never From. No customer confirmation email. |
| Presentation | Temporary Form & Field branding, local fonts, professional copy and responsive CSS. Final creative work remains replaceable. |

## Architecture and caching

One React client and one Node backend are sufficient for this PoC. Application use cases depend on small `ProductRepository` and `EnquirySender` interfaces; adapters are selected only in the server entry point. No inheritance hierarchy or DI container.

Fake Store is the default product source. Its adapter validates and caches the dataset **in memory for five minutes**. Browsing, search, details and enquiry product lookups share it; concurrent misses share one fetch. The next request after expiry refreshes the cache.

This avoids repeated upstream calls without adding Redis or another service. The cache resets on restart and is process-local. Multiple replicas would need a shared cache if duplicate upstream calls became a problem. Failed refreshes return an explicit error rather than stale data or a silent fixture fallback.

The product contract resembles Fake Store as a deliberate shortcut. A future adapter can translate another source into it without changing React. Larger catalogues should move filtering and pagination to repository query methods.

## Simplifications and limitations

No core browse/search/detail/enquiry requirement was intentionally dropped.

- **Featured selection is configuration**, not an admin screen. No accounts, checkout or inventory system.
- **No enquiry database, queue or idempotency.** Email is synchronous with timeouts. An uncertain delivery followed by a retry can produce duplicates.
- **Mailpit is local capture only.** Messages are temporary; external deliverability, bounce handling and SPF/DKIM are not verified.
- **The fixture is opt-in.** It makes metadata deterministic for tests, but images still require internet.
- **Basic abuse protection only.** Rate limits and browser-origin checks are not authentication or bot prevention. Proxy configuration and shared limits need review before deploying multiple instances.
- **Health checks test process liveness**, not SMTP or Fake Store availability.
- **Chromium desktop/mobile tests are not full browser or accessibility certification.**
- **Automated checks are not personal review.** The candidate must read and own the code before submission; human review and time are not invented.

## How this can grow

- Replace Fake Store with a database/vendor adapter and add query/pagination methods when needed.
- Replace SMTP with another `EnquirySender`, such as SES, without changing application use cases.
- Replace fonts, CSS tokens and components without changing API contracts.
- Deploy the container to AWS after adding production email, TLS, privacy/retention rules, monitoring and distributed abuse controls. No AWS infrastructure is included.

## With another day

1. Persist enquiries and add an outbox/idempotency mechanism.
2. Confirm business copy, contact requirements, privacy policy and creative direction.
3. Review keyboard/screen-reader behavior and test Safari/Firefox and failure UI states.
4. Add privacy-safe operational logs, dependency monitoring and production email configuration.
5. Agree catalogue scale/SEO needs before adding pagination, a database or SSR.
