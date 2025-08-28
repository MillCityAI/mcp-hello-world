# System Design

## 1. Context & Components
- **Context:** MCP Inspector → HTTPS (Streamable HTTP) → Cloud Run service (TypeScript/Node 22 + Fastify) → Cloud Logging/Monitoring (Prometheus metrics).
- **Components:**
  - API layer: **Fastify (TypeScript, Node 22 LTS)**
  - Workers: None (MVP)
  - Data: **None (no persistence)**
  - Object storage: None
  - Auth & identity: Public endpoint (Inspector proxy handles its own session token)
  - Integrations: None

## 2. Data Model
- **Entities & fields:** N/A — no data stored
- **Relationships:** N/A
- **Migrations/backfills/rollback:** N/A

## 3. API Contracts

### 3.1 Streamable HTTP — `/mcp`
- **Method:** POST (supports CORS preflight `OPTIONS`)
- **Request:** Streamable HTTP per MCP; minimal init payload (JSON); no auth.
- **Response:** Server-Sent Events (SSE) stream; initial message contains `Hello, World`.
- **Success:** `200 OK`; headers: `Content-Type: text/event-stream`, `Cache-Control: no-store`, `Access-Control-Allow-Origin: *`
- **Errors:** `400` malformed request; `404` wrong path (hint: use `/mcp`); `429/413` rate/size limits; `5xx` unexpected error.
- **CORS:** `OPTIONS /mcp` returns `Access-Control-Allow-Methods: POST, OPTIONS` and `Access-Control-Allow-Headers` as needed.

### 3.2 Health — `/healthz`
- **Method:** GET
- **Response:** `200 OK`, JSON `{"status":"ok","uptime_s":<number>}`

### 3.3 Metrics — `/metrics`
- **Method:** GET
- **Response:** `200 OK`, **Prometheus text exposition** (latency histogram, request/error counters, `cold_start_rate`).

## 4. Threat Model (STRIDE)

| Asset | Threat (STRIDE) | Vector | Impact | Likelihood | Control |
|---|---|---|---|---|---|
| Public `/mcp` endpoint | Spoofing | Open Internet abuse | DoS / cost / logs noise | Medium | Rate limits; 429; payload size caps; regional deploy |
| `/mcp` request parser | Tampering | Malformed/oversized JSON | Crash / 5xx | Medium | Strict JSON parsing; body limit; input validation |
| SSE stream | Repudiation | Missing logs | Forensics gaps | Low | Structured logs: `handshake.ok/.error`, client tag |
| Cloud Run image | Information Disclosure | Secrets in logs | Secret exposure | Low | Redaction middleware; avoid sensitive headers |
| Build artifacts | Denial of Service | Vulnerable deps | Runtime failure | Low | SAST, dep scan, container scan; SBOM; signed images |
| CORS surface | Elevation of Privilege | Misconfigured CORS | Browser-driven abuse | Low | `Allow-Origin: *` on `/mcp` only; no credentials; verify preflight |
| Inspector Proxy | Spoofing/Tampering | Missing/invalid session token | Connect failure | Medium | Follow Inspector proxy flow; clear error messages |

- **Mitigations summary:** input limits, rate limiting, structured logs, ASVS L1 controls, SBOM and signed images, no persistence.

## 5. Non-Functional Requirements (NFRs)
- **Performance:** p95 ≤ 300 ms for `/mcp` (excluding cold starts); throughput target ~50 RPS sustained.
- **Reliability:** 99.5% successful handshakes over 30 days.
- **Security & compliance:** ASVS L1; logging redaction; secrets via Google Secret Manager.
- **Accessibility:** N/A (server-only). If UI added later, gate ≥95 Lighthouse; 0 serious axe violations.
- **Cost guardrails:** Cloud Run min-instances=0; alert if monthly cost >$5; consider min-instances=1 when demoing.

## 6. ADR Log (decisions & rationale)
| ID | Title | Status | Summary | Link |
|---|---|---|---|---|
| ADR-001 | Adopt TypeScript (Node 22) + Fastify | Accepted | TS/Node for ecosystem & speed; Fastify for perf & plugins | n/a |
| ADR-002 | Streamable HTTP on `/mcp` | Accepted | Use MCP Streamable HTTP; Inspector primary client | n/a |
| ADR-003 | Inspector-only client (no web UI) | Accepted | Reduce scope; focus on working baseline | n/a |
| ADR-004 | Deploy on Cloud Run | Accepted | Simple HTTPS container deploy, scales to zero | n/a |
| ADR-005 | Observability: prom-client + pino | Accepted | Prometheus text metrics; structured JSON logs | n/a |
| ADR-006 | No persistence | Accepted | MVP avoids DB/files to reduce risk & cost | n/a |