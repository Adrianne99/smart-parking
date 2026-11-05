import {
  ERROR_STATUS,
  type ApiErrorBody,
  type ErrorCode,
  type ValidationIssue,
} from '@smart-parking/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

/** Throw this from any handler; the error middleware turns it into the contract envelope. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get status(): number {
    return ERROR_STATUS[this.code];
  }
}

export const notFoundHandler: RequestHandler = () => {
  throw new ApiError('NOT_FOUND', 'No route matches this request.');
};

// body-parser errors carry a string `type`, e.g. 'entity.parse.failed'.
const bodyParserType = (err: unknown) =>
  typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string'
    ? err.type
    : undefined;

function toApiError(err: unknown): ApiError | undefined {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) {
    const issues: ValidationIssue[] = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ApiError('VALIDATION_FAILED', 'Request validation failed.', { issues });
  }
  switch (bodyParserType(err)) {
    case undefined:
      return undefined;
    case 'entity.too.large':
      return new ApiError('PAYLOAD_TOO_LARGE', 'Request body is too large.');
    case 'entity.parse.failed':
      return new ApiError('VALIDATION_FAILED', 'Request body is not valid JSON.');
    default:
      return new ApiError('VALIDATION_FAILED', 'Request body could not be read.');
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const known = toApiError(err);
  if (!known) req.log.error({ err }, 'Unhandled error');
  const apiError =
    known ??
    new ApiError('INTERNAL_ERROR', 'Something went wrong. Quote the request ID to support.');

  const body: ApiErrorBody = {
    error: {
      code: apiError.code,
      message: apiError.message,
      requestId: String(req.id),
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
    },
  };
  res.status(apiError.status).json(body);
};
