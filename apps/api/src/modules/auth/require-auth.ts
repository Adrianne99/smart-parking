import type { Request, RequestHandler } from 'express';
import { ApiError } from '../../http/errors';
import type { AccessTokenVerifier, AuthContext } from './verify-token';

const unauthenticated = () => new ApiError('UNAUTHENTICATED', 'Sign in to continue.');

export const requireAuth =
  (verify: AccessTokenVerifier): RequestHandler =>
  async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) throw unauthenticated();
    req.auth = await verify(token);
    next();
  };

/** The verified caller. Only call inside routes mounted behind `requireAuth`. */
export function authOf(req: Request): AuthContext {
  if (!req.auth) throw unauthenticated();
  return req.auth;
}
