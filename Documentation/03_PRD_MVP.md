# PRD + MVP Scope

## 1. Problem Statement
- Developers need a minimal hosted MCP baseline to validate client integration quickly—no tools, no state.

## 2. Users & Use Cases
- **Primary persona(s):** Internal developers validating MCP integration
- **User stories:**
  - As an internal developer, I want to connect via **MCP Inspector** and receive `Hello, World` so that I can validate MCP integration end-to-end.
    - Acceptance criteria: Given the server is deployed on Cloud Run with a public endpoint, when MCP Inspector initiates a Streamable HTTP MCP handshake to **`/mcp`**, then Inspector shows `Hello, World` and connection status is **connected** (p95 < 300 ms).
    - Error states: connection refused; non-2xx/upgrade failure; handshake timeout > 3s; unexpected payload shape; CORS/WS origin issues; proxy token invalid.
    - Telemetry: event=handshake.ok, props={client:'mcp-inspector', transport:'streamable-http', latency_ms, server_version, region}; on failure event=handshake.error with reason.

## 3. Journeys & Flows
- **Entry points:** MCP Inspector (primary)
- **Happy path:**
  1) Developer opens **MCP Inspector**.
  2) Enters the hosted MCP service URL (Cloud Run Streamable HTTP **`/mcp`**) and clicks **Connect**.
  3) Server completes handshake and responds with `Hello, World`.
  4) Inspector displays the message; connection status shows **connected**; close is clean.
  5) Server logs `handshake.ok` with latency and `client='mcp-inspector'`.
- **Edge cases & recovery:**
  - Timeout >3s ⇒ JSON `{code:'timeout'}`; log `handshake.error` reason=`timeout`.
  - SSE init/HTTP 4xx/5xx ⇒ `{code:'http_error'}` with status; log reason=`http_error`.
  - CORS/preflight failure ⇒ 403 with correct headers; log reason=`cors`.
  - Invalid path ⇒ 404 with hint to use `/mcp`; log reason=`invalid_path`.
  - Proxy session token missing/invalid ⇒ 401/403; log reason=`proxy_auth`.
  - Oversized payload / rate limit ⇒ 413/429 with `Retry-After`; log reason=`limit`.

## 4. Feature Requirements
- **/mcp (Streamable HTTP):** returns `Hello, World` as first SSE message.
- **/healthz:** `200` JSON `{status:'ok', uptime_s}`.
- **/metrics:** Prometheus text exposition (latency histogram, request/error counters, `cold_start_rate`).
- **CORS:** `OPTIONS /mcp` allows `POST, OPTIONS`; `Access-Control-Allow-Origin: *`; no credentials.
- **Logging:** structured logs with `requestId`, `region`, `build_sha`, `instance_id`; redaction middleware.

## 5. Non-Functional (Acceptance)
- **Performance:** p95 ≤ **300 ms** for **/mcp** (excluding cold starts); track **cold_start_rate** separately.
- **Reliability:** **99.5%** successful handshakes over **30 days**.
- **Security (OWASP/ASVS):** ASVS L1 with SAST, dep scan, container scan; SBOM per release; signed images; secrets in GSM; CVE SLOs (Critical 24h, High 72h).
- **Accessibility (ADA/WCAG 2.2 AA):** N/A (server-only). If UI later: Lighthouse ≥95; 0 serious axe violations; keyboard-only path; visible focus; SR announcements.
- **Privacy/data:** No user data stored; no persistence. Operational logs only (latency_ms, region, build_sha, instance_id) with header redaction; retention ≤ 30 days.

## 6. Analytics & Metrics
- **Events:** `handshake.ok`, `handshake.error`
- **Metrics:** latency histogram (ms), request count, error count, `cold_start_rate`
- **Labels:** `region`, `build_sha`, `instance_id`
- **/metrics:** Prometheus text exposition

## 7. MVP Scope (MoSCoW)
- **Must:**
  - Handshake returns `Hello, World` (MCP Inspector)
  - `/healthz` and `/metrics` endpoints exposed (Prometheus text exposition)
  - README with MCP Inspector connection steps
  - CI/CD: GitHub → Cloud Build → Cloud Run
  - Security: OWASP ASVS L1, **SBOM per release**, **signed images**
  - Tests ≥90% overall, **critical paths 100%**
  - Structured logging and latency metrics (p50/p95/p99)
- **Should:**
  - Dev container / Dockerfile for local run parity
  - `npm run` scripts for build/test/serve
  - Region pinning for Cloud Run to stabilize cold starts
- **Could:**
  - Terraform skeleton
  - GitHub badges for CI and coverage
- **Won’t (now):**
  - Authentication or accounts
  - Any persistence (DB, caches) or MCP tools
  - Slack integration or SSO
  - Multi-tenancy
- **Edge cases cut:** fallback transports; browser storage/PWA; i18n
- **Operational concessions:** manual step acceptable: copy Cloud Run URL into Inspector

## 8. Open Questions
- None for v0.1

## 9. Traceability Matrix
| Story | Tests | Metrics | Owner |
|---|---|---|---|
| `Hello from /mcp` via Inspector | Unit + integration for `/mcp`, `/healthz`, `/metrics` | latency p95, request/error counts, cold_start_rate | Paul |