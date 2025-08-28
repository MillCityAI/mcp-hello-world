import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { register } from '../utils/metrics.js';

export async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics', async (_request, reply) => {
    const metrics = await register.metrics();
    
    reply
      .header('Content-Type', register.contentType)
      .send(metrics);
  });

  // Handle other HTTP methods with helpful error
  const methodNotAllowedHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(405).send({
      error: {
        message: 'Method Not Allowed. Use GET for metrics.',
        code: 405,
        allowed_methods: ['GET']
      }
    });
  };

  fastify.post('/metrics', methodNotAllowedHandler);
  fastify.put('/metrics', methodNotAllowedHandler);
  fastify.delete('/metrics', methodNotAllowedHandler);
  fastify.patch('/metrics', methodNotAllowedHandler);
}