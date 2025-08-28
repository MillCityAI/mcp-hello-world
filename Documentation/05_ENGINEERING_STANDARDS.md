# Engineering Standards (Single Source)

## 1. Code & Repo
- Language defaults: **TypeScript (Node 22 LTS) + Fastify**
- Style: **ESLint + Prettier**; `tsconfig.json` with `"strict": true`; path aliases via tsconfig `paths`
- Commits: Conventional Commits
- Branching: `main` protected; `feat/*`, `fix/*` via PR

## 2. Reviews
- Small PRs; reference story/ADR; include tests

## 3. Testing (Targets)
- Unit + integration ≥ **90%** (critical paths **100%**)
- Vitest + c8; Fastify `app.inject` + Supertest; fake timers via `@sinonjs/fake-timers`
- Coverage gates enforced in CI

## 4. Pre-Commit (Local)
- Format & lint (`eslint .` + Prettier), typecheck (`tsc --noEmit`), secret scan (gitleaks), Conventional Commits

## 5. CI/CD (GitHub → Cloud Build → Cloud Run)
- CI: typecheck → lint → tests (`vitest --coverage`) → coverage gates (≥90% / 100% critical) → SAST (**CodeQL**) → dep scan (npm audit/OSV) → container scan (**Trivy**) → secret scan (**gitleaks**)
- Build: Cloud Build builds image; generate **SBOM** (Syft); **sign** image (Cosign); push to Artifact Registry
- CD: deploy to Cloud Run (min-instances=0); smoke `/healthz`; contract probe `/mcp` expecting `Hello, World` via Streamable HTTP
- Rollback: redeploy last passing image; Release tags: `vMAJOR.MINOR.PATCH`

## 6. Security Baseline (OWASP ASVS L1)
- **ASVS L1 baseline**; strict JSON parsing; body size limits
- CORS: allow `POST, OPTIONS` on `/mcp`; `Access-Control-Allow-Origin: *`; no credentials
- Secrets in **Google Secret Manager**; rotation policy; never commit secrets
- CVE SLOs — Critical 24h, High 72h
- Logs redact auth headers and PII; no tokens/PII in logs

## 7. Accessibility (ADA / WCAG 2.2 AA)
- **Server-only**: N/A now. If a UI appears later: Lighthouse ≥95, 0 serious axe violations; keyboard-only flows; visible focus; SR announcements

## 8. AI Policy
- No sensitive customer data in prompts
- Sanitize LLM outputs before execution
- Add acceptance tests for generated code
- Minimal evals for critical prompts; jailbreak testing

## 9. API Contract Governance
- Versioned contracts; backward-compat checks in CI; deprecation policy

## 10. Performance Budgets
- `/mcp` p95 < **300 ms** (excluding cold starts); bundle size N/A (server)

## 11. Error Handling, Logging, Telemetry
- Logs: structured JSON via **pino**; include `requestId`, `region`, `build_sha`, `instance_id`; redaction for auth headers
- Metrics: **prom-client** histogram (latency ms), counters for `handshake.ok/.error`, gauge for `cold_start_rate`
- Tracing: optional OpenTelemetry SDK (off by default)
- Error model: JSON `{code, message, requestId}`; map known failures to 4xx; 5xx for unexpected