import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API for Node 18/20 compatibility with Worker code
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}
