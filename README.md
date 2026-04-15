# ParaBank AI-Native Test Automation Framework

[![Tests](https://img.shields.io/endpoint?url=https://sonalpriya17.github.io/fabric_assignment/badges/tests.json)](https://sonalpriya17.github.io/fabric_assignment/)
[![ParaBank E2E](https://github.com/sonalpriya17/fabric_assignment/actions/workflows/e2e.yml/badge.svg)](https://github.com/sonalpriya17/fabric_assignment/actions/workflows/e2e.yml)

**Live dashboard:** https://sonalpriya17.github.io/fabric_assignment/

Scaffold generated with idiomatic TypeScript + Playwright + playwright-bdd architecture.

## Quick start

1. `npm install`
2. `npx playwright install`
3. `cp .env.example .env`
4. `npm run check:coverage`
5. `npm run generate:tests`
6. `npm test`

See [docs/ADR.md](docs/ADR.md) for architecture decisions.

## CI/CD

GitHub Actions workflow: [.github/workflows/e2e.yml](.github/workflows/e2e.yml)

**Triggers**
- `push` on any branch — every commit runs the full UI + API suite.
- `pull_request` — gates PRs against `main`.
- `workflow_dispatch` — manual "Run workflow" button in the Actions tab.

> Why not trigger on commits to the application-under-test? ParaBank (https://parabank.parasoft.com/parabank) is a public Parasoft demo site — we don't own it and can't receive its commit hooks. "Every commit" in this context means every commit to this test-framework repo.

**What the pipeline does**
1. Installs deps + Playwright browsers.
2. Runs POM coverage check and AI test generation.
3. Executes `npx playwright test` (both `ui` and `api` projects) with `continue-on-error` so reporting still runs on failures.
4. Generates the AI/dashboard summary.
5. Uploads artifacts: `playwright-report/`, `test-results/`, `reports/`, `ai-audit/` — under the name `parabank-reports`.
6. Writes a markdown summary to the run page via `$GITHUB_STEP_SUMMARY`.
7. Sends an email report via SMTP (see below).
8. Fails the job red if any test failed (email + artifacts are already uploaded by this point).

**Required GitHub secrets**

| Secret | Example | Purpose |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server |
| `SMTP_PORT` | `587` | SMTP port (STARTTLS) |
| `SMTP_SECURE` | `false` | `true` only for implicit TLS (port 465) |
| `SMTP_USER` | `you@gmail.com` | SMTP login |
| `SMTP_PASS` | 16-char Gmail App Password | **Not** your regular Google password |
| `SMTP_FROM` | `you@gmail.com` | `From:` address |
| `REPORT_RECIPIENT` | `you@example.com` | Where the report is delivered |

Set them with the `gh` CLI:

```bash
gh secret set SMTP_HOST        --body "smtp.gmail.com"
gh secret set SMTP_PORT        --body "587"
gh secret set SMTP_SECURE      --body "false"
gh secret set SMTP_USER        --body "<your-gmail>"
gh secret set SMTP_PASS        --body "<16-char-app-password>"
gh secret set SMTP_FROM        --body "<your-gmail>"
gh secret set REPORT_RECIPIENT --body "<recipient>"
```

**Gmail app-password setup** (one-time on the Google side)
1. Enable 2-Step Verification on the sending account.
2. Create an app password at https://myaccount.google.com/apppasswords (label it "ParaBank CI").
3. Use the 16-char string as `SMTP_PASS`.

**Local dry-run of the email report**

```bash
SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... \
REPORT_RECIPIENT=you@example.com \
GITHUB_SERVER_URL=https://github.com \
GITHUB_REPOSITORY=sonalpriya17/fabric_assignment \
GITHUB_RUN_ID=TEST GITHUB_SHA=abc1234 GITHUB_REF_NAME=main \
npm run send:report
```

Leave the `SMTP_*` vars unset to print the markdown summary to stdout without sending mail.

## Reports

- **Dashboard (latest run + recent history):** https://sonalpriya17.github.io/fabric_assignment/
- **Playwright HTML report (latest):** https://sonalpriya17.github.io/fabric_assignment/latest/playwright-report/
- **AI session dashboard (latest):** https://sonalpriya17.github.io/fabric_assignment/latest/session-dashboard.html
- **History JSON:** https://sonalpriya17.github.io/fabric_assignment/history.json
- **Status badge (shields.io endpoint):** https://sonalpriya17.github.io/fabric_assignment/badges/tests.json

The dashboard is published by the `deploy-pages` job after every successful `main` build. Failed builds do **not** overwrite the published dashboard, so the last-known-green report stays visible.

**What the email contains**
- Branch + short commit SHA.
- Counts: total, passed, failed, retries, flaky.
- List of failed-test artifact paths (screenshots, traces, videos) as they appear inside the uploaded `parabank-reports` artifact.
- A "View full run &amp; download artifacts" link back to the Actions run page.
