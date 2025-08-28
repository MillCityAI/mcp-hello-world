import { describe, it, expect, beforeEach } from 'vitest';
import { 
  register,
  httpRequestsTotal,
  httpRequestDuration,
  mcpHandshakeTotal,
  mcpHandshakeDuration,
  coldStartRate,
  serverUptime 
} from '../../src/utils/metrics.js';

describe('Metrics utilities', () => {
  beforeEach(async () => {
    // Reset metrics by clearing and re-registering them
    register.clear();
    register.registerMetric(httpRequestsTotal);
    register.registerMetric(httpRequestDuration);
    register.registerMetric(mcpHandshakeTotal);
    register.registerMetric(mcpHandshakeDuration);
    register.registerMetric(coldStartRate);
    register.registerMetric(serverUptime);
  });

  describe('register', () => {
    it('should be a Prometheus registry', () => {
      expect(register).toBeDefined();
      expect(typeof register.metrics).toBe('function');
    });

    it('should have correct content type', () => {
      expect(register.contentType).toContain('text/plain');
    });
  });

  describe('HTTP metrics', () => {
    it('should increment HTTP request counter', async () => {
      // Start with 0 and increment
      httpRequestsTotal.inc({
        method: 'GET',
        route: '/healthz',
        status_code: '200'
      });

      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_http_requests_total');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('route="/healthz"');
      expect(metrics).toContain('status_code="200"');
    });

    it('should observe HTTP request duration', async () => {
      httpRequestDuration.observe({
        method: 'POST',
        route: '/mcp',
        status_code: '200'
      }, 0.5);

      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_http_request_duration_seconds');
      expect(metrics).toContain('method="POST"');
      expect(metrics).toContain('route="/mcp"');
    });
  });

  describe('MCP metrics', () => {
    it('should track MCP handshake attempts', async () => {
      mcpHandshakeTotal.inc({
        client: 'mcp-inspector',
        status: 'success'
      });

      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_handshake_total');
      expect(metrics).toContain('client="mcp-inspector"');
      expect(metrics).toContain('status="success"');
    });

    it('should track MCP handshake duration', async () => {
      mcpHandshakeDuration.observe({
        client: 'unknown',
        status: 'error'
      }, 1.5);

      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_handshake_duration_seconds');
      expect(metrics).toContain('client="unknown"');
      expect(metrics).toContain('status="error"');
    });
  });

  describe('Cold start tracking', () => {
    it('should have cold start counter', async () => {
      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_cold_start_total');
    });
  });

  describe('Server uptime', () => {
    it('should track server uptime', async () => {
      // Wait a bit to ensure uptime is measured
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check using registry metrics
      const metrics = await register.metrics();
      expect(metrics).toContain('mcp_hello_world_uptime_seconds');
    });
  });
});