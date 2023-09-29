import app from './app';
import path from 'path';
import { Debugger } from 'debug';
import express, { Router } from 'express';
import * as middlewares from './lib/middlewares';
import { EmptyRoutesError, setUpRoutes } from '@lib/utils';
import { Context, ExtendedRequest } from '@type/request';
import outbox from '@services/outbox';
import 'websocket-polyfill';

import { logger } from './lib/utils';
import prisma from '@services/prisma';

const port = process.env.PORT || 8000;

const log: Debugger = logger.extend('index');

const ctx: Context = { prisma, outbox };

// Generate routes
log('Setting up routes...');
let routes: Router = express.Router();
let startExpress = true;

try {
  routes = setUpRoutes(routes, path.join(__dirname, 'rest'));
} catch (e) {
  if (e instanceof EmptyRoutesError) {
    log('Empty routes, this module will not be reachable by HTTP API');
    startExpress = false;
  } else {
    throw e;
  }
}

if (startExpress) {
  // Setup context
  routes.use((req, res, next) => {
    (req as ExtendedRequest).context = ctx;
    next();
  });

  // Setup express routes
  app.use('/', routes);

  // Setup express routes
  app.use(middlewares.notFound);
  app.use(middlewares.errorHandler);

  //-- Start process --//

  // Start listening
  app.listen(port, () => {
    log(`Server is running on port ${port}`);
  });
}
