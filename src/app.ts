import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import express, { NextFunction, Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from './lib/middlewares';
import { generateRoutes } from './lib/utils';
import path from 'path';
import { ExtendedRequest } from './types/request';

const prisma = new PrismaClient({
  log: [{ level: 'query', emit: 'event' }],
});

const app = express();

// Header Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(cors());

// Generate routes
const restDirectory = path.join(__dirname, 'rest');
const routes = generateRoutes(restDirectory);

// Setup context
routes.use((req, res, next) => {
  console.log('Time:', Date.now());
  (req as ExtendedRequest).context = {
    prisma,
  };
  next();
});

// Setup express routes
app.use('/', routes);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
