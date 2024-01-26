import app from '../src/app';

describe('Express app', () => {
  it('should instantiate express', () => {
    expect(app).toBeDefined();
  });
});
