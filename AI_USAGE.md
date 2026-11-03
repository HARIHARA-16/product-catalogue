# AI Usage and Ownership

## Tools

- GitHub Copilot in VS Code planned, generated, edited and reviewed the implementation with the user directing the task. The precise underlying model identifier is not recorded here; it is not guessed.
- Tools used: file reads/patches, terminal execution, npm audit, a GitHub-advisory dependency scan, TypeScript, ESLint, Vitest/Supertest, Docker Compose, Playwright and screenshot inspection. External sources were Fake Store API and Google Fonts' source repository.
- No delegated/subagent implementation was used. No paid hosted model/service is needed to run the result.
- [AGENTS.md](AGENTS.md) contains the repository's AI instructions. [PLAN.md](PLAN.md) is the implementation and test plan, created before feature code.

## Five Shaping Moments

These are a faithful summary of the actual user request and implementation moments, not fabricated verbatim prompts.

1. **User direction:** build the supplied catalogue challenge locally in a new folder, using React, Node, Docker, SOLID principles and coding standards. This drove a TypeScript web client/backend and one-command Compose setup.
2. **Resolve gaps explicitly:** editorial home selection versus rating-ranked category highlights, local captured SMTP, optional phone and literal search were recorded instead of asking the challenge authors.
3. **Keep the changeable parts replaceable:** inject ProductRepository and EnquirySender into use cases and isolate HTTP/React/provider code. Avoid an unnecessary database, dependency-injection framework or inheritance hierarchy.
4. **Validate immediately:** start with backend behavior tests, then a real Docker image, then desktop/mobile Playwright tests that confirm email content inside Mailpit rather than accepting a successful screen as delivery evidence.
5. **Review failures, not just output:** inspect audit reports, type errors, browser traces/screenshots and editor diagnostics; correct the code or test depending on the evidence, then repeat the same check.

## What AI Got Wrong and How It Was Caught

- **Initial dependency selection:** conservative older major versions had current advisories. `npm audit` exposed them before feature implementation. Patched versions and narrowly documented transitive overrides resolved the audit; the final tree and fresh Docker `npm ci` were verified.
- **"Latest" was not automatically compatible:** the current TypeScript major was outside typescript-eslint's supported peer range. npm refused it. TypeScript remains on supported 5.9; Vite and its React plugin were aligned. npm's stale installed tree required a forced resolution during bootstrap, but the submitted lockfile installs normally with `npm ci`.
- **Router API assumption:** a removed `RouterProvider` fallback prop failed type checking. It was replaced with React Router 7's route-level hydration fallback.
- **A unit-level pass did not prove browser behavior:** the first browser run found missing dialog focus restoration. The dialog now closes before explicitly restoring focus to the enquiry trigger; desktop and mobile tests verify it.
- **Test bugs were separated from app bugs:** a partial "Menswear" selector also matched "Womenswear", a ranking assertion guessed fixture order incorrectly, and E2E initially reused an old server build. Exact selectors, fixture-grounded order and a build-before-E2E script fixed these issues without changing correct business behavior.
- **Visual/editor review added evidence:** screenshots exposed stale validation errors during correction; errors now clear per edited field. Editor diagnostics also caught the missing CSS import types and standard line-clamp declaration.

## Evidence and Remaining Human Work

Automated checks cover type safety, lint, 20 backend tests, production builds and 10 desktop/mobile browser tests. Tests include live local SMTP capture, missing products, invalid requests, upstream failure and mail failure. The browser suite passed against both a native fixture-mode backend and the rebuilt Docker app using the live source. Screenshots were inspected for home, product and enquiry layouts; complete image loading and page overflow are asserted. The resolved dependency audit and the additional direct-runtime-dependency advisory scan reported no known vulnerabilities.

Follow-up work polished the interface copy and layout, simplified documentation, and added a cache regression test covering the exact five-minute expiry boundary and reuse across browsing, search and details. Before publication, `npm run check` passed with 21 tests, and `npm run test:e2e` passed all 10 desktop/mobile tests against the fixture-mode backend and real Mailpit SMTP.

This is AI-assisted implementation and AI-assisted review, **not a claim that the candidate has personally reviewed every line**. Before submission, read the source, run the critical path yourself, explain the trade-offs in DECISIONS.md, and update this record with your own changes and time.

## Time Spent

Initial automated local session: approximately **25 minutes**. Rough activity split: planning/setup 3 minutes, implementation 10 minutes, tests/debugging 7 minutes, review/documentation 5 minutes. These are elapsed AI-assisted session estimates, not measured human coding time.

The first plan artifact was created at **2026-11-03 12:36 UTC**. The user/candidate's independent reading, review, interview preparation and publishing time are not measured and must be added by them. No claim is made that the candidate spent 2-3 hours.