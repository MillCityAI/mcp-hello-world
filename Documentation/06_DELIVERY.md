# Delivery (Roadmap, Release, Comms)

## 1. Roadmap (Now / Next / Later)
- **Now (v0.1.0):**
  - `/mcp` returns `Hello, World`
  - `/healthz` JSON OK
  - `/metrics` Prometheus text (latency histogram + handshake counters)
  - CI (typecheck, lint, tests ≥90/100), SBOM (Syft), sign (Cosign), Trivy scan
  - Deploy to Cloud Run (min-instances=0)
  - README with MCP Inspector steps
- **Next:** _not planned_
- **Later:** _not planned_
- **Risks/assumptions:** cold start vs p95; Cloud Run region; Inspector proxy/token setup

## 2. Release Plan
- Environments: Single environment (Prod on Cloud Run)
- Stages: Single v0.1.0 release
- Rollout: direct deploy; rollback = redeploy last passing image

### Release Readiness Checklist
- [ ] `/mcp` returns `Hello, World` in Inspector
- [ ] `/healthz` returns 200
- [ ] `/metrics` exposes Prometheus text; latency & counters present
- [ ] CI green: typecheck, lint, tests ≥90% / 100% critical
- [ ] SBOM generated; image signed; Trivy scan has no Critical/High
- [ ] Cloud Run URL confirmed; README updated
- [ ] **Draft PR opened to MCP protocol repo with project summary & repo link**

## 3. Changelog (SemVer)
### 2025-08-28 v0.1.0 — Initial release
- Inspector-only Streamable HTTP `/mcp`
- `/healthz` and `/metrics` (Prometheus)
- CI/CD with SBOM + signed image

## 4. Communications
- Stakeholder updates: none (one-and-done)
- External comms: README + GitHub release notes only (include the MCP draft PR link)