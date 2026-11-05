import { HEADERS } from '@smart-parking/contracts';
import { randomUUID } from 'node:crypto';
import { pino, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Env } from '../config/env';

// Accept a caller's correlation ID only if it is short and log-safe; otherwise mint one.
const REQUEST_ID_PATTERN = /^[\w-]{8,128}$/;

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    // Never log credentials. Ticket tokens must never be sent in URLs/headers, only JSON bodies,
    // and request bodies are not logged.
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[REDACTED]',
    },
  });
}

/** Request logging + request ID (set on `req.id` and echoed in the X-Request-Id response header). */
export const requestLogger = (logger: Logger) =>
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id'];
      const id =
        typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
      res.setHeader(HEADERS.requestId, id);
      return id;
    },
  });
