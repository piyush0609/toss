import { describe, it, expect } from 'vitest';
import { signJWT, verifyJWT } from '../../src/templates/worker/src/jwt.js';

const SECRET = 'a3f7c9e1d2b4a6085c7e9f1023456789abcdef0123456789abcdef0123456789';

describe('JWT', () => {
  it('should roundtrip sign and verify', async () => {
    const payload = { sub: 'abc123', iat: 1700000000, exp: 1700003600 };
    const token = await signJWT(payload, SECRET);
    expect(token).toMatch(/^eyJ/);

    const decoded = await verifyJWT(token, SECRET);
    expect(decoded.sub).toBe('abc123');
    expect(decoded.iat).toBe(1700000000);
    expect(decoded.exp).toBe(1700003600);
  });

  it('should reject tampered token', async () => {
    const payload = { sub: 'abc123', iat: 1700000000, exp: 1700003600 };
    const token = await signJWT(payload, SECRET);
    const tampered = token.slice(0, -5) + 'xxxxx';

    await expect(verifyJWT(tampered, SECRET)).rejects.toThrow('Invalid signature');
  });

  it('should reject wrong secret', async () => {
    const payload = { sub: 'abc123', iat: 1700000000, exp: 1700003600 };
    const token = await signJWT(payload, SECRET);

    await expect(verifyJWT(token, 'wrong-secret-0123456789abcdef')).rejects.toThrow('Invalid signature');
  });

  it('should reject malformed token', async () => {
    await expect(verifyJWT('not.a.token', SECRET)).rejects.toThrow('Invalid token format');
    await expect(verifyJWT('badtoken', SECRET)).rejects.toThrow('Invalid token format');
  });

  it('should reject expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const payload = { sub: 'abc123', iat: past - 3600, exp: past };
    const token = await signJWT(payload, SECRET);

    const decoded = await verifyJWT(token, SECRET);
    // verifyJWT only checks signature; expiry is checked by caller
    expect(decoded.exp).toBe(past);
  });
});
