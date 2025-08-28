import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { httpRequestsTotal, httpRequestDuration } from '../utils/metrics.js';

export async function setupMetricsMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
    const route = request.routerPath || 'unknown';
    
    // Record metrics
    httpRequestsTotal.inc({
      method: request.method,
      route,
      status_code: reply.statusCode.toString()
    });

    httpRequestDuration.observe(
      {
        method: request.method,
        route,
        status_code: reply.statusCode.toString()
      },
      duration
    );
  });
}

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}