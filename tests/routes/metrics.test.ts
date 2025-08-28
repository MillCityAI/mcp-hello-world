import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestServer, closeServer } from '../utils/testServer.js';

describe('/metrics endpoint', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await closeServer(server);
  });

  it('should return Prometheus metrics format', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    
    const metrics = response.payload;
    
    // Should contain basic metrics
    expect(metrics).toContain('# TYPE');
    expect(metrics).toContain('# HELP');
    expect(metrics).toContain('mcp_hello_world_');
    
    // Should contain our custom metrics
    expect(metrics).toContain('mcp_hello_world_http_requests_total');
    expect(metrics).toContain('mcp_hello_world_http_request_duration_seconds');
    expect(metrics).toContain('mcp_hello_world_handshake_total');
    expect(metrics).toContain('mcp_hello_world_uptime_seconds');
  });

  it('should include Node.js process metrics', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    const metrics = response.payload;
    
    // Default Node.js metrics
    expect(metrics).toContain('process_cpu_user_seconds_total');
    expect(metrics).toContain('nodejs_');
  });

  it('should track HTTP requests after making calls', async () => {
    // Make a health check request first
    await server.inject({
      method: 'GET',
      url: '/healthz'
    });

    const response = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    const metrics = response.payload;
    
    // Should have recorded the health check request
    expect(metrics).toContain('mcp_hello_world_http_requests_total');
    expect(metrics).toMatch(/mcp_hello_world_http_requests_total.*method="GET".*route="\/healthz"/);
  });

  it('should not accept POST requests', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/metrics'
    });

    expect(response.statusCode).toBe(405);
  });
});