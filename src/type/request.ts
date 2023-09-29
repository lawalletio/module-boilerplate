import { Request } from 'express';
import type { PrismaClient } from '@prisma/client';
import { Outbox } from '@services/outbox';

export interface Context {
  prisma: PrismaClient;
  outbox: Outbox;
}

export interface ExtendedRequest extends Request {
  context: Context;
}
