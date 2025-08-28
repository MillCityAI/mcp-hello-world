import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestServer, closeServer } from '../utils/testServer.js';

describe('/healthz endpoint', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await closeServer(server);
  });

  it('should return 200 with health status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/healthz'
    });

    expect(response.statusCode).toBe(200);
    
    const payload = JSON.parse(response.payload);
    expect(payload).toMatchObject({
      status: 'ok',
      uptime_s: expect.any(Number),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      version: expect.any(String)
    });

    expect(payload.uptime_s).toBeGreaterThanOrEqual(0);
  });

  it('should include correct content type header', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/healthz'
    });

    expect(response.headers['content-type']).toContain('application/json');
  });

  it('should increment uptime on subsequent calls', async () => {
    const response1 = await server.inject({
      method: 'GET',
      url: '/healthz'
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    const response2 = await server.inject({
      method: 'GET',
      url: '/healthz'
    });

    const payload1 = JSON.parse(response1.payload);
    const payload2 = JSON.parse(response2.payload);

    expect(payload2.uptime_s).toBeGreaterThanOrEqual(payload1.uptime_s);
  });

  it('should not accept POST requests', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/healthz'
    });

    expect(response.statusCode).toBe(405);
  });
});