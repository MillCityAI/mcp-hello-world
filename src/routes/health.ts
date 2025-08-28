import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/healthz', async () => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    return {
      status: 'ok',
      uptime_s: uptimeSeconds,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0'
    };
  });

  // Handle other HTTP methods with helpful error  
  const methodNotAllowedHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(405).send({
      error: {
        message: 'Method Not Allowed. Use GET for health checks.',
        code: 405,
        allowed_methods: ['GET']
      }
    });
  };

  fastify.post('/healthz', methodNotAllowedHandler);
  fastify.put('/healthz', methodNotAllowedHandler);
  fastify.delete('/healthz', methodNotAllowedHandler);
  fastify.patch('/healthz', methodNotAllowedHandler);
}