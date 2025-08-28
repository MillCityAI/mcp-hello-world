import pino from 'pino';
import type { FastifyRequest } from 'fastify';

const isProduction = process.env.NODE_ENV === 'production';

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level(label: string) {
      return { level: label };
    }
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.headers["x-auth-token"]'
    ],
    remove: true
  }
};

if (!isProduction) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  };
}

const logger = pino(loggerOptions);

export function createRequestLogger(req: FastifyRequest) {
  return logger.child({
    requestId: req.id,
    region: process.env.REGION || 'unknown',
    buildSha: process.env.BUILD_SHA || 'dev',
    instanceId: process.env.INSTANCE_ID || 'local'
  });
}

export { logger };