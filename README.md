# KTO CMS — End-to-End Test Suite

Automated browser tests for the [KTO CMS](https://kto-cms-ecru.vercel.app/) admin application. The suite validates critical user journeys—authentication, navigation across admin sections, and logout—using [Playwright](https://playwright.dev/) with [Cucumber/Gherkin](https://cucumber.io/) via [playwright-bdd](https://vitalets.github.io/playwright-bdd/), a Page Object Model, and typed custom fixtures.

## Overview

| Concern | Approach |
|--------|----------|
| Test runner | Playwright Test |
| BDD layer | Cucumber Gherkin via playwright-bdd |
| Package manager | pnpm |
| Pattern | Page Object Model + fixture-based dependency injection |
| Browsers | Chromium, Firefox, WebKit (WebKit excluded for the main flow due to site instability) |
| CI | GitHub Actions on `main` / `master` |
| Container | Multi-stage Docker image with browser dependencies |

Tests run against a configurable `BASE_URL`, so the same suite can target local, staging, or production-like environments without code changes.

## Prerequisites

- **Node.js** 20 LTS (aligned with the Docker image)
- **pnpm** 10.x (`corepack enable` or `npm i -g pnpm`)
- **Git** for cloning and CI parity

Playwright will download browser binaries on first install. On Linux, system libraries are installed via `playwright install --with-deps`.

## Quick Start

```bash
# Clone and enter the repository
git clone <repository-url>
cd test

# Install dependencies
pnpm install

# Install browsers (required once per machine / CI agent)
pnpm exec playwright install --with-deps

# Configure environment
cp .env.example .env
# Edit .env with valid TEST_USERNAME and TEST_PASSWORD

# Run the suite
pnpm test
```

## Configuration

Environment variables are loaded from `.env` via `dotenv` (see `playwright.config.ts` and `tests/support/test-data.ts`). Never commit `.env`; use `.env.example` as the contract.

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application under test | `https://kto-cms-ecru.vercel.app/` |
| `TEST_USERNAME` | Login email | — (required for real runs) |
| `TEST_PASSWORD` | Login password | — (required for real runs) |
| `HEADLESS` | Browser headless mode | `true` |
| `CI` | Set by GitHub Actions; enables `forbidOnly`, retries, and single worker | — |

`playwright.config.ts` sets `baseURL` from `BASE_URL`, enables HTML reporting, traces on first retry, and parallel execution locally (serialized on CI for stability).

## Project Structure

```
tests/
├── features/           # Gherkin feature files (.feature)
│   └── kto-cms-login.feature
├── steps/              # Step definitions mapping Gherkin to page actions
│   └── kto-cms-login.steps.ts
├── pages/              # Page Object Model — locators and page actions
│   ├── base.page.ts
│   ├── login.page.ts
│   └── admin.page.ts
└── support/
    ├── fixtures.ts     # Extended test with loginPage / adminPage + createBdd()
    └── test-data.ts    # Credentials and navigation labels

.features-gen/          # Generated Playwright specs (gitignored; run bddgen)
playwright.config.ts    # Runner, projects, reporters, BDD config
.github/workflows/      # CI pipeline
Dockerfile              # Reproducible test execution in containers
```

**Design notes**

- **Features express behavior** — scenarios are written in Gherkin; `bddgen` converts them to Playwright tests before each run.
- **Steps stay thin** — step definitions delegate to page objects; selectors live in page classes.
- **Fixtures** inject `LoginPage` and `AdminPage` via `createBdd(test)` so steps do not construct pages manually.
- **Shared data** (`TEST_USER`, `NAVIGATION`) centralizes copy and routes; credentials come from the environment.
- **WebKit** is skipped for the primary login scenario where the target app behaves inconsistently; Chromium and Firefox remain the source of truth for regressions.

## Running Tests

| Command | Purpose |
|---------|---------|
| `pnpm test` | Generate specs from features, then run headless across browser projects |
| `pnpm run bddgen` | Regenerate Playwright specs from `.feature` files only |
| `pnpm run test:headed` | Visible browser (debugging) |
| `pnpm run test:ui` | Playwright UI mode |
| `pnpm run test:report` | Open the last HTML report |
| `pnpm run test:watch` | Re-run on file changes (nodemon) |
| `pnpm run codegen` | Record selectors against `BASE_URL` |

Run a single project or feature when iterating:

```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test .features-gen/tests/features/kto-cms-login.feature.spec.js
```

## Continuous Integration

The [Playwright workflow](.github/workflows/playwright.yml) runs on push and pull requests to `main` / `master`:

1. Checkout, Node LTS, `pnpm install`
2. `playwright install --with-deps`
3. `pnpm test` (generates Gherkin specs, then runs Playwright)
4. Upload artifacts (always, even when tests fail):
   - **`playwright-report`** — HTML report (download and open `index.html`)
   - **`test-results`** — traces, screenshots, and videos from failed/retried tests

4. Upload artifacts (always, even when tests fail):
   - **`playwright-report`** — HTML report (download and open `index.html`)
   - **`test-results`** — traces, screenshots, and videos from failed/retried tests
5. On push to `main` / `master`, publish the report to **GitHub Pages** (public, no login)

### Public report (anyone can view or download)

After each push to `main` or `master`, the latest HTML report is published publicly:

| Link | Purpose |
|------|---------|
| [View report](https://mehedimohammad213.github.io/Playwite-practice-with-Docker-and-CI-CD/) | Open the interactive HTML report in a browser |
| [Download zip](https://mehedimohammad213.github.io/Playwite-practice-with-Docker-and-CI-CD/playwright-report.zip) | Download the full report as a zip file |

No GitHub login is required. These links always show the report from the **most recent** push to `main` / `master`.

### Download from GitHub Actions (maintainers)

Each workflow run also shows download buttons at the top of the job summary (GitHub login required for artifacts):

1. Open the repo on GitHub and go to the **Actions** tab.
2. Click the **Playwright Tests** workflow run you want to inspect.
3. At the top of the run summary, click **Download Playwright Report** (green button).
4. Unzip the file and open **`index.html`** in your browser.

If a test failed, use **Download Test Results** (red button) for traces and screenshots.

You can also download from the **Artifacts** table at the bottom of the same page — click **`playwright-report`**.

Or use the GitHub CLI (replace `RUN_ID` with the run number from the Actions URL):

```bash
gh run download RUN_ID -n playwright-report -D ./playwright-report
open ./playwright-report/index.html   # macOS
xdg-open ./playwright-report/index.html   # Linux
```

To download traces and screenshots from a failed run:

```bash
gh run download RUN_ID -n test-results -D ./test-results
pnpm exec playwright show-trace test-results/**/trace.zip
```

Artifacts are kept for **30 days**. Configure repository secrets or variables if CI must use non-default credentials or `BASE_URL` (e.g. staging).

## Docker

The multi-stage `Dockerfile` installs dependencies and browsers in a builder stage, then provides a slim runtime with `ENTRYPOINT ["pnpm"]` and default `CMD ["test"]`.

```bash
docker build -t kto-cms-e2e .
docker run --rm --env-file .env kto-cms-e2e test
docker run --rm --env-file .env kto-cms-e2e run test:headed
```

Pass `-e BASE_URL=...` instead of `--env-file` when you do not want a local `.env` in the container context.

## Reports and Debugging

- **HTML report** — Generated under `playwright-report/`; open with `pnpm run test:report`.
- **Traces** — Captured on first retry (`trace: on-first-retry`); inspect in [Trace Viewer](https://playwright.dev/docs/trace-viewer).
- **Artifacts** — `test-results/` and reports are gitignored; CI preserves reports via workflow artifacts.

For flaky failures, prefer `--project=chromium` and headed/UI mode before changing timeouts globally.

## Adding Tests

1. Add or extend a class under `tests/pages/` with role- or test-id-based locators.
2. Register new page objects in `tests/support/fixtures.ts` if they should be injected.
3. Add constants to `test-data.ts` when strings or routes are reused.
4. Write a `.feature` file under `tests/features/` describing the scenario in Gherkin.
5. Implement matching steps in `tests/steps/` using `Given`, `When`, and `Then` from `fixtures.ts`.

Run `pnpm run bddgen` after editing feature files (or use `pnpm test`, which runs it automatically).

Keep assertions at the page layer or in steps intentionally—avoid duplicating selectors in step files.

## Security

- Do not commit real credentials; rely on `.env` locally and CI secrets in automation.
- `.env` is listed in `.gitignore`; rotate any credentials that were ever committed.

## License

ISC — see `package.json`.
