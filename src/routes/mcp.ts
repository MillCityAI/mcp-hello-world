import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../utils/logger.js';
import { mcpHandshakeTotal, mcpHandshakeDuration } from '../utils/metrics.js';

interface McpRequestBody {
  method?: string;
  params?: unknown;
  id?: string | number;
}

export async function mcpRoutes(fastify: FastifyInstance) {
  // CORS preflight is handled by the @fastify/cors plugin

  // MCP Streamable HTTP endpoint
  fastify.post('/mcp', async (request: FastifyRequest<{ Body: McpRequestBody }>, reply: FastifyReply) => {
    const startTime = Date.now();
    const logger = createRequestLogger(request);
    const clientType = request.headers['user-agent']?.includes('mcp-inspector') ? 'mcp-inspector' : 'unknown';
    
    logger.info({
      event: 'mcp.handshake.start',
      client: clientType,
      body: request.body
    }, 'MCP handshake initiated');

    try {
      // Set up Server-Sent Events headers
      reply
        .header('Content-Type', 'text/event-stream')
        .header('Cache-Control', 'no-store')
        .header('Connection', 'keep-alive')
        .header('Access-Control-Allow-Origin', '*')
        .status(200);

      // Send initial SSE response with Hello, World
      const response = {
        jsonrpc: '2.0',
        id: request.body.id || null,
        result: {
          message: 'Hello, World',
          timestamp: new Date().toISOString(),
          server: 'mcp-hello-world',
          version: '0.1.0'
        }
      };

      // Format as SSE
      const sseData = `data: ${JSON.stringify(response)}\n\n`;
      reply.raw.write(sseData);

      // Log successful handshake
      const duration = (Date.now() - startTime) / 1000;
      logger.info({
        event: 'mcp.handshake.success',
        client: clientType,
        latency_ms: Date.now() - startTime,
        duration_s: duration
      }, 'MCP handshake completed');

      // Update metrics
      mcpHandshakeTotal.inc({ client: clientType, status: 'success' });
      mcpHandshakeDuration.observe({ client: clientType, status: 'success' }, duration);

      // Keep connection open briefly then close gracefully
      setTimeout(() => {
        reply.raw.end();
      }, 100);

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      logger.error({
        event: 'mcp.handshake.error',
        client: clientType,
        error: error instanceof Error ? error.message : 'unknown',
        duration_s: duration
      }, 'MCP handshake failed');

      // Update error metrics
      mcpHandshakeTotal.inc({ client: clientType, status: 'error' });
      mcpHandshakeDuration.observe({ client: clientType, status: 'error' }, duration);

      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.body.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'unknown')
            : undefined
        }
      };

      reply.status(500).send(errorResponse);
    }
  });

  // Handle other HTTP methods with helpful error
  const methodNotAllowedHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(405).send({
      error: {
        message: 'Method Not Allowed. Use POST for MCP requests.',
        code: 405,
        allowed_methods: ['POST', 'OPTIONS']
      }
    });
  };

  fastify.get('/mcp', methodNotAllowedHandler);
  fastify.put('/mcp', methodNotAllowedHandler);
  fastify.delete('/mcp', methodNotAllowedHandler);
  fastify.patch('/mcp', methodNotAllowedHandler);
  fastify.head('/mcp', methodNotAllowedHandler);
}