# Form & Field

A product catalogue with featured products, category browsing, search, product details and email enquiries.

## Run locally

Start Docker Desktop, then run:

```sh
docker compose up --build
```

- Catalogue: http://localhost:3000
- Enquiry inbox (Mailpit): http://localhost:8025
- Stop: press `Ctrl+C`, then run `docker compose down`.

The first build needs internet. No Node installation, paid service or email credentials are required for Docker setup.

### If Docker will not open

On macOS, open **Docker** from Applications or run:

```sh
open -a Docker
docker info
```

If `docker info` shows server details, the engine is running even if the Docker window is not visible. Use the whale icon in the menu bar to open the dashboard. Wait for the engine to start before running Compose. Do not reset Docker or delete its data to troubleshoot a missing window.

If port 3000 is occupied:

```sh
APP_PORT=4173 PUBLIC_ORIGIN=http://localhost:4173 docker compose up --build
```

Optional configuration is in [.env.example](.env.example). Compose reads `.env`; native npm commands do not. `PUBLIC_ORIGIN` must match the browser URL.

## Try it

1. View the five **Featured products** on the home page.
2. Select a category to see its top-rated products and remaining selection.
3. Search for `backpack`, then open the matching product.
4. Select **Enquire about this product** and enter a name, email and message. Phone is optional.
5. Submit, check the thank-you message, and open Mailpit to inspect the email.

Enquiries go to `sales@example.test` by default. Mailpit captures them locally; it does not forward them to an external inbox. Messages are temporary (up to 100), not database records. Use test contact details.

## Product data and cache

React requests product JSON from our backend, never directly from Fake Store.

The backend fetches and validates Fake Store products, then caches them **in memory for five minutes**. Browsing, search, details and enquiry product lookups reuse that dataset. Simultaneous cache misses share one fetch. The first request after expiry refreshes it.

The cache resets on restart and is not shared between server instances. A failed refresh shows an error; it does not silently serve stale data or switch to static products. Redis is unnecessary for this single-server, 20-product demo.

For repeatable tests or offline metadata, explicitly use the bundled snapshot:

```sh
PRODUCT_SOURCE=fixture docker compose up --build
```

Product images still need internet.

## Development and tests

Use **Node 24+** for native development:

```sh
npm ci
npm run check
```

`check` runs TypeScript, ESLint, unit/API/adapter tests and a production build.

For browser tests with real local email capture:

```sh
docker compose up -d mailpit
npx playwright install chromium
npm run test:e2e
```

The browser suite uses an isolated fixture-mode backend on port 3100 and tests desktop/mobile flows. Images need internet. To test a running app instead, use `BASE_URL=http://localhost:4173 npm run test:e2e`.

For hot reload, start Mailpit and run:

```sh
PORT=3200 PUBLIC_ORIGIN=http://localhost:5173 npm run dev
```

Open http://localhost:5173.

## Design

- **React + TypeScript:** a responsive web client without mobile setup or a global state framework.
- **Node.js + TypeScript + Express:** shared validation schemas and a small HTTP backend that also serves the built client.
- **Replaceable adapters:** application use cases depend on `ProductRepository` and `EnquirySender`. Only the server entry point selects Fake Store and SMTP implementations.
- **Basic safeguards:** validated requests/products, fixed server-owned mail recipient and product details, request limits, origin checks and security headers. No secrets or enquiry bodies in logs.
- **AWS-compatible container:** no AWS account is needed locally. Production still needs TLS, durable enquiry delivery, authenticated email and operational controls.

Source: `src/client`, `src/server`, `src/shared`. Tests: `tests` and `tests/e2e`.

## Submission and supporting notes

- [DECISIONS.md](DECISIONS.md): assumptions, limitations and next steps.
- [AI_USAGE.md](AI_USAGE.md): AI tools, mistakes caught and time notes.
- [PLAN.md](PLAN.md): original implementation/testing plan.
- [AGENTS.md](AGENTS.md): committed AI instructions.

Before submission, personally review the code, record your actual time and leave the feature-branch PR into `main` open for assessment.

Demo products/images come from [Fake Store API](https://fakestoreapi.com/). DM Sans and Newsreader fonts are self-hosted with their licence files. Confirm product/image rights and replace temporary branding before commercial use.
