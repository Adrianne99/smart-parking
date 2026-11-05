import type { AuthContext } from '../modules/auth/verify-token';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after JWT verification. */
      auth?: AuthContext;
    }
  }
}
