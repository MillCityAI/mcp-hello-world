import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../utils/logger.js';
import { httpRequestsTotal } from '../utils/metrics.js';

export async function setupErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const logger = createRequestLogger(request);
    const statusCode = error.statusCode || 500;
    
    // Log error details
    logger.error({
      error: {
        message: error.message,
        stack: error.stack,
        statusCode
      },
      url: request.url,
      method: request.method
    }, 'Request error');

    // Update metrics
    httpRequestsTotal.inc({
      method: request.method,
      route: request.routerPath || 'unknown',
      status_code: statusCode.toString()
    });

    // Send appropriate error response
    const errorResponse = {
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        code: statusCode,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error.message
        })
      },
      requestId: request.id
    };

    await reply.status(statusCode).send(errorResponse);
  });
}