# ORCHESTRATION.md
**Audience:** AI + human developers  
**Purpose:** Single playbook to build, test, secure, deploy, and operate this app.  
**Replace Mode:** Replace `[TBD]` inline; delete unused sections if not valuable.  
**Source of truth:** This repo; when in doubt, ADR entries in `04_SYSTEM_DESIGN.md` win.

## Files (Read in this Order)
1. `01_VISION.md` — intent, scope, metrics, constraints
2. `03_PRD_MVP.md` — use cases, acceptance, MVP scope
3. `04_SYSTEM_DESIGN.md` — components, data, APIs, ADRs, threat model
4. `05_ENGINEERING_STANDARDS.md` — coding, tests, CI/CD, OWASP/ASVS, ADA/WCAG, AI policy
5. `06_DELIVERY.md` — roadmap, rollout, changelog, comms
6. `07_OPERATIONS.md` — observability, runbooks, SLOs/DR

## TL;DR
- **Project:** Hello, World MCP
- **Goal:** Successful handshake + ‘Hello, World’ using the MCP Inspector (Streamable HTTP on `/mcp`)
- **Primary users:** Internal developers validating MCP integration
- **NSM:** Cold start to ‘Hello, World’ <300 ms p95 on Cloud Run (excluding cold starts for perf acceptance; cold_start_rate tracked)
- **DoD (v0.1.0):** Inspector shows “Hello, World”; `/healthz` 200; `/metrics` Prometheus text; CI green (≥90% / 100% critical); SBOM + signed image; Cloud Run deployed; README has Inspector steps; draft PR to MCP protocol repo
- **License:** Apache-2.0

## Build/Run Matrix
| Mode | Command | Notes |
|---|---|---|
| Local dev | `npm i && npm run dev` | Fastify with hot-reload; `/mcp`, `/healthz`, `/metrics` |
| Local test | `npm run test` | Vitest + c8; coverage gate enforced |
| Container | `docker build -t hello-mcp . && docker run -p 8080:8080 hello-mcp` | Exposes `/mcp` etc. |
| Cloud | Cloud Build → Cloud Run | Min-instances=0; scale-to-zero; consider `min-instances=1` when demoing |

## Env & secrets
| Key | Required | Default | Source |
|---|---|---|---|
| `PORT` | no | 8080 | Cloud Run |
| `REGION` | no | (auto) | Cloud Run metadata |
| `BUILD_SHA` | no | (inject in build) | Cloud Build |
| `INSTANCE_ID` | no | (auto) | Cloud Run |
| (secrets) | no | n/a | Google Secret Manager (none needed in MVP) |

## Golden path (dev → prod)
1) Clone repo; `npm i`  
2) `npm run dev`; hit `/healthz`; connect with MCP Inspector to `http://localhost:8080/mcp`  
3) PR → CI gates (typecheck/lint/tests/coverage/scans) → Cloud Build → Artifact Registry (SBOM + signed)  
4) Deploy to Cloud Run; confirm `/healthz` + Inspector “Hello, World” on `/mcp`  
5) Open draft PR to MCP protocol repo with summary + repo link

## CI/CD gates
- Typecheck (`tsc --noEmit`), lint (`eslint .`), tests (`vitest --coverage`) with coverage gates ≥90% / 100% critical  
- Security gates: CodeQL SAST; dep scan (npm audit/OSV); Trivy container scan; gitleaks secret scan  
- **API Contracts Gate:** probe `/mcp` (Streamable HTTP) → expect initial `Hello, World`

## NFRs
- See `04_SYSTEM_DESIGN.md` → NFRs (perf p95 ≤ 300 ms for `/mcp`, excluding cold starts; 99.5% handshake reliability; ASVS L1; cost guardrails)

## Accessibility policy
- Server-only; if UI added later, WCAG 2.2 AA with Lighthouse ≥95 and 0 serious axe violations.

## Ops/Runbooks
- See `07_OPERATIONS.md` (minimal, one-and-done: no paging, simple runbooks, stateless DR)

## AI developer guide
- Read `01_VISION.md` and `03_PRD_MVP.md` first, then `04_SYSTEM_DESIGN.md`  
- Use Replace Mode: replace nearest `[TBD]` first; delete empty sections; avoid duplicates  
- Prompt idea: “Write a Fastify Streamable HTTP `/mcp` route that sends ‘Hello, World’ as the first SSE message.”

## DoD checklist
- [ ] Inspector connects to `/mcp` and shows “Hello, World”
- [ ] `/healthz` 200; `/metrics` Prometheus text
- [ ] CI green; coverage ≥90% / 100% critical paths
- [ ] SBOM attached; image signed; Trivy clean (no Critical/High)
- [ ] Cloud Run URL confirmed; README updated with Inspector steps
- [ ] Draft PR opened to MCP protocol repo

## Milestones
- v0.1.0 (target): 2025-08-28 — initial public release (Inspector-only, Streamable HTTP)

## Risks
- Cold starts may exceed handshake timeout on first connect → retry or set `min-instances=1` briefly
- CORS / preflight misconfig on `/mcp` → verify `OPTIONS` and headers
- Inspector proxy/token issues → use pre-filled link; restart proxy if needed

## References
- 01_VISION.md, 03_PRD_MVP.md, 04_SYSTEM_DESIGN.md, 05_ENGINEERING_STANDARDS.md, 06_DELIVERY.md, 07_OPERATIONS.md