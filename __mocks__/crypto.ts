const _crypto = jest.requireActual<typeof import('crypto')>('crypto');

_crypto.randomBytes = (size: number): Buffer => {
  return Buffer.alloc(size);
};

module.exports = _crypto;
