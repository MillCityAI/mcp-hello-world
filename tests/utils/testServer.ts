import { createServer } from '../../src/index.js';
import type { FastifyInstance } from 'fastify';

export async function createTestServer(): Promise<FastifyInstance> {
  const server = await createServer();
  return server;
}

export async function closeServer(server: FastifyInstance): Promise<void> {
  await server.close();
}