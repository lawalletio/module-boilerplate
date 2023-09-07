import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from '@lib/middlewares';
import { setUpRoutes } from '@lib/utils';
import path from 'path';
import { ExtendedRequest } from '@type/request';

// Instantiate prisma client
const prisma = new PrismaClient({
  log: [{ level: 'query', emit: 'event' }],
});

// Instantiate expresss
const app = express();

// Header Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(cors());

// Generate routes
const restDirectory = path.join(__dirname, 'rest');
const routes = setUpRoutes(express.Router(), restDirectory);

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
