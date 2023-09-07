import { Request } from 'express';
import type { PrismaClient } from '@prisma/client';

export interface Context {
  prisma?: PrismaClient;
}

export interface ExtendedRequest extends Request {
  context: Context;
}
