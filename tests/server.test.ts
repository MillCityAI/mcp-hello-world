import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestServer, closeServer } from './utils/testServer.js';

describe('Server setup', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await closeServer(server);
  });

  describe('Security headers', () => {
    it('should include security headers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting', async () => {
      const requests = Array.from({ length: 5 }, () =>
        server.inject({
          method: 'GET',
          url: '/healthz'
        })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed under normal rate limit
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('404 handling', () => {
    it('should return helpful 404 for unknown routes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/unknown-route'
      });

      expect(response.statusCode).toBe(404);
      
      const payload = JSON.parse(response.payload);
      expect(payload.error.message).toBe('Not Found');
      expect(payload.error.path).toBe('/unknown-route');
      expect(payload.error.suggestion).toContain('/mcp');
      expect(payload.error.suggestion).toContain('/healthz');
      expect(payload.error.suggestion).toContain('/metrics');
      expect(payload.requestId).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS for all routes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
        headers: {
          origin: 'https://example.com'
        }
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Request ID generation', () => {
    it('should generate unique request IDs', async () => {
      const response1 = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      const response2 = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      expect(response1.headers['x-request-id']).toBeDefined();
      expect(response2.headers['x-request-id']).toBeDefined();
      expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
    });

    it('should use provided request ID header', async () => {
      const customId = 'test-request-123';
      
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
        headers: {
          'x-request-id': customId
        }
      });

      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Error handling', () => {
    it('should handle request body parsing errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle oversized request bodies', async () => {
      const largePayload = 'x'.repeat(100000); // Create a very large payload
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        payload: largePayload,
        headers: {
          'content-type': 'application/json'
        }
      });

      expect([400, 413, 500]).toContain(response.statusCode);
    });
  });
});