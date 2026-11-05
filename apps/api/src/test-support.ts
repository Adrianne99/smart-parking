// Test-only helpers. Not imported by server.ts, so never bundled into the API.
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { createTokenVerifier } from './modules/auth/verify-token';

export const TEST_SUPABASE_URL = 'http://auth.test';
const issuer = `${TEST_SUPABASE_URL}/auth/v1`;

/** Minimal valid env for createApp; the DB URL points nowhere unless a test supplies a real one. */
export const testEnvVars = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:1/unreachable',
  SUPABASE_URL: TEST_SUPABASE_URL,
} as const;

// A per-run ES256 key pair standing in for the Supabase project's signing key.
const { publicKey, privateKey } = await generateKeyPair('ES256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'ES256' };

export const testVerifier = createTokenVerifier({
  issuer,
  keys: createLocalJWKSet({ keys: [jwk] }),
});

/** A Supabase-shaped access token for `userId`; override claims/header to build bad tokens. */
export function tokenFor(
  userId: string | undefined,
  options: {
    claims?: JWTPayload;
    expiresIn?: string;
    issuer?: string;
    audience?: string;
    key?: Parameters<SignJWT['sign']>[0];
  } = {},
) {
  const jwt = new SignJWT({ role: 'authenticated', ...options.claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setIssuer(options.issuer ?? issuer)
    .setAudience(options.audience ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? '5m');
  if (userId) jwt.setSubject(userId);
  return jwt.sign(options.key ?? privateKey);
}
