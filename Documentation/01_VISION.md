# Vision & Strategy

## 1. Product Overview
- **Product name:** Hello, World MCP
- **One-liner:** Hosted MCP ‘Hello, World’: a zero-tool server that replies ‘Hello, World’ on connect.
- **Primary users:** Internal developers validating MCP integration
- **Purpose:** Successful handshake + ‘Hello, World’ using the MCP Inspector.
- **Open-source intent:** Publish publicly and propose inclusion in the broader MCP protocol GitHub repository.
- **License:** Apache-2.0
- **Stack override:** TypeScript (Node 22 LTS); Inspector-only client.

## 2. Success
- **NSM:** Cold start to ‘Hello, World’ <300 ms p95 on Cloud Run.
- **Secondary:** Successful MCP Inspector connection with one-click proxy token link.

## 3. Principles & Constraints
- **Guiding principles**
  - Smallest viable surface (no state, no tools)
  - Observability first (health/metrics/logs from day one)
- **Key constraints**
  - No database, no state, single container image
  - Streamable HTTP on `/mcp`; Prometheus metrics

## 4. Risks & Dates
- **Top risk:** Cold-start budget on Cloud Run (p95 <300 ms may be tight).
- **Target date (v0.1 OSS release):** Thursday, August 28, 2025

## 5. Non‑Negotiables
- Security: OWASP ASVS L1; SAST/dep/container scans; **SBOM per release**; **signed images**; secrets in Google Secret Manager; CVE SLOs (Critical 24h, High 72h).
- Accessibility: N/A (server-only). If a UI appears later: WCAG 2.2 AA with gate ≥95 Lighthouse and 0 serious axe violations.
- Quality: Tests ≥90% overall; **critical paths 100%**.