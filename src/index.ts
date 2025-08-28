import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './utils/logger.js';
import { setupCors } from './middleware/cors.js';
import { setupErrorHandler } from './middleware/errorHandler.js';
import { setupMetricsMiddleware } from './middleware/metrics.js';
import { healthRoutes } from './routes/health.js';
import { metricsRoutes } from './routes/metrics.js';
import { mcpRoutes } from './routes/mcp.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function createServer() {
  const fastify = Fastify({
    logger: false, // Use our custom logger
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID()
  });

  try {
    // Security middleware
    await fastify.register(helmet, {
      contentSecurityPolicy: false // Disable CSP for SSE compatibility
    });

    // Rate limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      errorResponseBuilder: (_request, context) => ({
        code: 429,
        error: 'Rate limit exceeded',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        retryAfter: Math.round(context.ttl / 1000)
      })
    });

    // CORS setup
    await setupCors(fastify);
    
    // Metrics middleware
    await setupMetricsMiddleware(fastify);
    
    // Error handler
    await setupErrorHandler(fastify);

    // Add request ID to response header
    fastify.addHook('onRequest', async (request, reply) => {
      reply.header('x-request-id', request.id);
    });

    // Routes
    await fastify.register(healthRoutes);
    await fastify.register(metricsRoutes);
    await fastify.register(mcpRoutes);

    // 404 handler
    fastify.setNotFoundHandler((_request, reply) => {
      const routes = ['/mcp', '/healthz', '/metrics'];
      reply.status(404).send({
        error: {
          message: 'Not Found',
          code: 404,
          path: _request.url,
          suggestion: `Try one of: ${routes.join(', ')}`
        },
        requestId: _request.id
      });
    });

    return fastify;
  } catch (error) {
    logger.error(error, 'Failed to create server');
    throw error;
  }
}

async function start() {
  let server: FastifyInstance;
  
  try {
    server = await createServer();
    
    const address = await server.listen({
      port: PORT,
      host: HOST
    });

    logger.info({
      event: 'server.start',
      address,
      port: PORT,
      host: HOST,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }, `Server listening at ${address}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down server');
      try {
        await server.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error(error, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    promise,
    reason: reason instanceof Error ? reason.message : reason
  }, 'Unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught exception');
  process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { createServer };