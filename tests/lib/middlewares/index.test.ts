import * as index from '../../../src/lib/middlewares';

describe('Index', (): void => {
  it('should have exports', (): void => {
    expect(index).toEqual(expect.any(Object));
  });

  it('should not have undefined exports', (): void => {
    for (const k of Object.keys(index)) {
      expect(index).not.toHaveProperty(k, undefined);
    }
  });
});
