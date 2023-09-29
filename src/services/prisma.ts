import { logger } from '@lib/utils';
import { PrismaClient } from '@prisma/client';
import { Debugger } from 'debug';

const log: Debugger = logger.extend('index');

// Instantiate prisma client
log('Instantiate prisma');
const prisma = new PrismaClient({
  log: [{ level: 'query', emit: 'event' }],
});

export default prisma;
