import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'mcp_hello_world_'
});

// Custom metrics
export const httpRequestsTotal = new client.Counter({
  name: 'mcp_hello_world_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new client.Histogram({
  name: 'mcp_hello_world_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

export const mcpHandshakeTotal = new client.Counter({
  name: 'mcp_hello_world_handshake_total',
  help: 'Total number of MCP handshakes',
  labelNames: ['client', 'status'],
  registers: [register]
});

export const mcpHandshakeDuration = new client.Histogram({
  name: 'mcp_hello_world_handshake_duration_seconds',
  help: 'MCP handshake duration in seconds',
  labelNames: ['client', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 3],
  registers: [register]
});

export const coldStartRate = new client.Counter({
  name: 'mcp_hello_world_cold_start_total',
  help: 'Total number of cold starts',
  registers: [register]
});

// Track server startup time
const serverStartTime = Date.now();

export const serverUptime = new client.Gauge({
  name: 'mcp_hello_world_uptime_seconds',
  help: 'Server uptime in seconds',
  registers: [register],
  collect() {
    this.set((Date.now() - serverStartTime) / 1000);
  }
});

// Initialize cold start tracking
if (process.env.K_SERVICE) {
  // We're running on Cloud Run, increment cold start counter
  coldStartRate.inc();
}

export { register };