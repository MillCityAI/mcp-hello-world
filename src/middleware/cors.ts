import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export async function setupCors(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false
  });
}