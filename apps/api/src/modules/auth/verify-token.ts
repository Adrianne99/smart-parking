import { uuidSchema } from '@smart-parking/contracts';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { ApiError } from '../../http/errors';

export type AuthContext = { userId: string };
export type AccessTokenVerifier = (token: string) => Promise<AuthContext>;

/**
 * Verifies a Supabase Auth access token: asymmetric signature (ES256/RS256 only, never HS256 or
 * "none"), issuer, audience and expiry. Identity only; permissions come from our membership tables.
 */
export function createTokenVerifier(options: {
  issuer: string;
  keys: JWTVerifyGetKey;
}): AccessTokenVerifier {
  return async (token) => {
    let sub: string | undefined;
    try {
      const { payload } = await jwtVerify(token, options.keys, {
        issuer: options.issuer,
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
      });
      sub = payload.sub;
    } catch (err) {
      // An unreachable or broken JWKS is our outage, not the caller's fault: don't log them out.
      if (
        err instanceof errors.JWKSTimeout ||
        err instanceof errors.JWKSInvalid ||
        !(err instanceof errors.JOSEError)
      ) {
        throw new ApiError(
          'SERVICE_UNAVAILABLE',
          'Sign-in could not be verified right now. Try again shortly.',
        );
      }
      throw new ApiError(
        'UNAUTHENTICATED',
        'Your session is invalid or has expired. Sign in again.',
      );
    }

    // Anon/service tokens and API keys have no user subject.
    const userId = uuidSchema.safeParse(sub);
    if (!userId.success) {
      throw new ApiError(
        'UNAUTHENTICATED',
        'Your session is invalid or has expired. Sign in again.',
      );
    }
    return { userId: userId.data };
  };
}

export function supabaseTokenVerifier(supabaseUrl: string): AccessTokenVerifier {
  return createTokenVerifier({
    issuer: `${supabaseUrl}/auth/v1`,
    keys: createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)),
  });
}
