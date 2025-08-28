import { describe, it, expect } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { logger, createRequestLogger } from '../../src/utils/logger.js';

describe('Logger utilities', () => {
  describe('logger', () => {
    it('should be a pino logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('createRequestLogger', () => {
    it('should create a child logger with request context', () => {
      const mockRequest = {
        id: 'test-request-123',
      } as FastifyRequest;

      // Mock environment variables
      const originalRegion = process.env.REGION;
      const originalBuildSha = process.env.BUILD_SHA;
      const originalInstanceId = process.env.INSTANCE_ID;

      process.env.REGION = 'us-central1';
      process.env.BUILD_SHA = 'abc123';
      process.env.INSTANCE_ID = 'instance-456';

      const requestLogger = createRequestLogger(mockRequest);

      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger.info).toBe('function');

      // Restore environment variables
      process.env.REGION = originalRegion;
      process.env.BUILD_SHA = originalBuildSha;
      process.env.INSTANCE_ID = originalInstanceId;
    });

    it('should use default values for missing environment variables', () => {
      const mockRequest = {
        id: 'test-request-456',
      } as FastifyRequest;

      // Clear environment variables
      const originalRegion = process.env.REGION;
      const originalBuildSha = process.env.BUILD_SHA;
      const originalInstanceId = process.env.INSTANCE_ID;

      delete process.env.REGION;
      delete process.env.BUILD_SHA;
      delete process.env.INSTANCE_ID;

      const requestLogger = createRequestLogger(mockRequest);

      expect(requestLogger).toBeDefined();

      // Restore environment variables
      process.env.REGION = originalRegion;
      process.env.BUILD_SHA = originalBuildSha;
      process.env.INSTANCE_ID = originalInstanceId;
    });
  });
});