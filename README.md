# Form & Field

A product catalogue with featured products, category browsing, search, product details and email enquiries.

## Download the project

Install [Git](https://git-scm.com/downloads) if needed, then open a terminal and run:

```sh
git clone --branch feature/product-catalogue https://github.com/HARIHARA-16/product-catalogue.git
cd product-catalogue
```

The application is on `feature/product-catalogue` while the assessment PR remains open. If you already have the project, open a terminal in its directory instead of cloning again.

Choose **Docker setup** to run the app, or **native development setup** to edit it with hot reload.

## Docker setup (recommended)

1. Install and open [Docker Desktop](https://www.docker.com/products/docker-desktop/). Wait until its engine is running.
2. From the project directory, start the app and enquiry inbox:

```sh
docker compose up --build
```

3. Open the catalogue at http://localhost:3000 and enquiry inbox (Mailpit) at http://localhost:8025.
4. To stop, press `Ctrl+C`, then run `docker compose down`.

The first build needs internet. **Do not run `nvm`, `npm install` or `npm ci` for this option:** Docker installs Node and dependencies inside the image. No paid service or email credentials are required.

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

## Native development setup (hot reload)

These terminal commands are for macOS/Linux. You need **Node 24+**. The app runs directly on your machine; Docker Desktop is still used below to run Mailpit for email enquiries.

### Step 1: Install and select Node

If you use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), install it using its official instructions if needed, reopen your terminal, and run:

```sh
nvm install 24
nvm use 24
node --version
npm --version
```

`node --version` should show `v24.x.x`. Run `nvm use 24` again in each new terminal used for this project.

Alternatively, install Node 24 from [nodejs.org](https://nodejs.org/en/download) and verify the versions with the last two commands. You do not need both installation methods.

### Step 2: Install project dependencies

From the `product-catalogue` directory:

```sh
npm ci
```

Use **`npm ci` rather than `npm install`** for setup: it installs the exact versions in the committed lockfile. Repeat it after pulling dependency changes, not every time you start the app. Use `npm install <package>` only when intentionally adding or changing a dependency.

### Step 3: Start the enquiry inbox

Open Docker Desktop, wait for the engine, then run:

```sh
docker compose up -d mailpit
```

Mailpit is available at http://localhost:8025, with SMTP on `localhost:1025`. No email account or SMTP password is needed.

### Step 4: Start the application

```sh
PORT=3200 PUBLIC_ORIGIN=http://localhost:5173 npm run dev
```

Keep this terminal open. Visit **http://localhost:5173** for the UI. Vite forwards API requests to the Node backend on port 3200. Keep port 5173 free: if Vite selects another port, the configured browser origin will not match.

Native npm commands do not load `.env` automatically; the command above supplies the port/origin settings. Browsing works without SMTP, but submitting an enquiry requires Mailpit.

### Step 5: Stop development

Press `Ctrl+C` in the application terminal. To stop Mailpit:

```sh
docker compose stop mailpit
```

## Run checks and browser tests

Complete the Node/dependency steps above first. In a new terminal, select Node and run:

```sh
nvm use 24
npm run check
```

Skip `nvm use 24` if you installed Node without nvm. `check` runs TypeScript, ESLint, unit/API/adapter tests and a production build; it does not need Mailpit or Docker.

For browser tests, keep Docker Desktop running and use:

```sh
nvm use 24
docker compose up -d mailpit
npx playwright install chromium
npm run test:e2e
```

Install Chromium once per machine (and again if the Playwright version changes). The browser suite builds the app, starts an isolated fixture-mode backend on port 3100 and tests desktop/mobile flows with real Mailpit email capture. Keep port 3100 free. Product images need internet.

To test an already running Docker app instead of the isolated backend:

```sh
BASE_URL=http://localhost:3000 npm run test:e2e
```

Replace the URL with `http://localhost:4173` if you used the alternative Docker port.

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
