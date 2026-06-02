import { webcrypto } from 'node:crypto';

// Node 18 does not expose global `crypto`; @nestjs/typeorm requires it.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}
