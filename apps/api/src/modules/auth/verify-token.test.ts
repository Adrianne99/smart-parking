import { generateKeyPair, SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { testVerifier, tokenFor } from '../../test-support';
import { createTokenVerifier } from './verify-token';

const userId = '00000000-0000-4000-8000-0000000000a1';
const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

async function rejection(token: string) {
  return testVerifier(token).then(
    () => expect.fail('token should be rejected'),
    (err: { code: string }) => err.code,
  );
}

describe('access token verification', () => {
  it('accepts a valid ES256 token and returns only the subject', async () => {
    await expect(testVerifier(await tokenFor(userId))).resolves.toEqual({ userId });
  });

  it('ignores role claims in the token (permissions come from memberships)', async () => {
    const token = await tokenFor(userId, { claims: { app_metadata: { role: 'SUPER_ADMIN' } } });
    await expect(testVerifier(token)).resolves.toEqual({ userId });
  });

  it.each([
    [
      'a tampered payload',
      async () => {
        const [h, , s] = (await tokenFor(userId)).split('.');
        return `${h}.${b64url({ sub: '00000000-0000-4000-8000-0000000000b1', aud: 'authenticated' })}.${s}`;
      },
    ],
    [
      'a token from another project (wrong issuer)',
      () => tokenFor(userId, { issuer: 'https://other.supabase.co/auth/v1' }),
    ],
    ['an expired token', () => tokenFor(userId, { expiresIn: '-1m' })],
    [
      'a token signed by an unknown key',
      async () => tokenFor(userId, { key: (await generateKeyPair('ES256')).privateKey }),
    ],
    [
      'a token without a user subject (anon/service key)',
      () => tokenFor(undefined, { claims: { role: 'anon' } }),
    ],
    ['a non-UUID subject', () => tokenFor('admin')],
    [
      'an HS256 token signed with a shared secret',
      () =>
        new SignJWT({ role: 'authenticated' })
          .setProtectedHeader({ alg: 'HS256', kid: 'test-key' })
          .setSubject(userId)
          .setIssuer('http://auth.test/auth/v1')
          .setAudience('authenticated')
          .setExpirationTime('5m')
          .sign(
            new TextEncoder().encode('super-secret-jwt-token-with-at-least-32-characters-long'),
          ),
    ],
    [
      'an unsigned alg:none token',
      async () =>
        `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: userId, aud: 'authenticated', iss: 'http://auth.test/auth/v1', exp: 9999999999 })}.`,
    ],
    ['garbage', async () => 'not-a-jwt'],
  ])('rejects %s with UNAUTHENTICATED', async (_label, make) => {
    expect(await rejection(await make())).toBe('UNAUTHENTICATED');
  });

  it('rejects a correctly signed token for the wrong audience', async () => {
    for (const audience of ['service_role', 'anon']) {
      expect(await rejection(await tokenFor(userId, { audience }))).toBe('UNAUTHENTICATED');
    }
  });

  it('reports an unreachable key server as SERVICE_UNAVAILABLE, not a logout', async () => {
    const verifier = createTokenVerifier({
      issuer: 'http://auth.test/auth/v1',
      keys: async () => {
        throw new TypeError('fetch failed');
      },
    });
    await expect(verifier(await tokenFor(userId))).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });
  });
});
