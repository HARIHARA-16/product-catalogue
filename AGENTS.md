# Project Instructions

- Keep scope to catalogue browsing/search/details and product enquiries.
- Keep React independent of Fake Store and SMTP. All product JSON goes through our API.
- Depend on ProductRepository and EnquirySender in application use cases; wire adapters only in the server entry point.
- Validate external data and requests. Never accept a sales recipient, sender, price or product title from the enquiry form.
- Keep secrets and personal data out of source control and logs.
- Prefer small components and interfaces over frameworks, inheritance or a DI container.
- Run `npm run check` after changes; run `npm run test:e2e` for user-facing changes with Mailpit running.
- Record changed assumptions and trade-offs in DECISIONS.md. Do not invent test results, human review or time spent.