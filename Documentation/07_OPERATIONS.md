# Operations (Observability, Runbooks, SLOs, DR)

## 1. Observability
- Metrics (per service): availability, latency p50/p95, error rate, throughput/cost
- Logs: structured, PII redacted
- Traces: (optional) for critical flows
- Dashboards: Skip dedicated dashboards; use Cloud Logging/Monitoring on demand.

## 2. Alerting
- Channels: None (no paging; manual checks as needed)
- Thresholds: N/A (no alerts configured)
- Escalation policy: N/A

## 3. Runbooks
### 3.1 General Incident
- **Symptom:** Inspector cannot connect (`proxy` error / timeout) or first-request timeout (cold start)
- **Checks:** Ensure Inspector proxy is running with a valid session token; confirm Cloud Run URL; check Cloud Logging for `handshake.error`
- **Cold start:** First request after scale-to-zero may take several seconds — retry once; temporarily set `min-instances=1` when demonstrating
- **Fix:** Redeploy last passing image; if CORS, verify `OPTIONS /mcp` and headers; if 404, use `/mcp` path
- **Post:** Note root cause in README if reproducible

### 3.2 CORS / Preflight Failure
- Symptom: 403/failed preflight
- Fix: Ensure `OPTIONS /mcp` returns `Access-Control-Allow-Methods: POST, OPTIONS` and `Access-Control-Allow-Origin: *` (no credentials).

### 3.3 Inspector Proxy / Token
- Symptom: `Error Connecting to MCP Inspector Proxy`
- Fix: Restart Inspector, open via pre-filled token link; verify proxy address/port.

## 4. SLOs & Error Budgets
- N/A (not 24/7). Track handshake success rate during sessions; aim for 99.5% when in use. Error budget not enforced.

## 5. Backups & DR
- No backups (no persistence).
- RTO 30 minutes (redeploy last passing image)
- RPO 0 (stateless)

## 6. On-Call
- Rotation: None (not continuously operated)
- Handover checklist: N/A