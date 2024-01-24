import { PrismaClient } from '@prisma/client';
import { getPrisma } from '@services/prisma';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(),
  };
});
describe('Prisma client', () => {
  it('should only instanciate prisma once', () => {
    const prisma = getPrisma();

    expect(getPrisma()).toBe(prisma);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
