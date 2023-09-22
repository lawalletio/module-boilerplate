import { Request } from 'express';
import type { PrismaClient } from '@prisma/client';
import { OutboxService } from '@services/outbox/Outbox';

export interface Context {
  prisma: PrismaClient;
  outbox: OutboxService;
}

export interface ExtendedRequest extends Request {
  context: Context;
}
