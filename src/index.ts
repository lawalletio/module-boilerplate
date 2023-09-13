import NDK, { type NDKRelay } from '@nostr-dev-kit/ndk';
import app from './app';
import path from 'path';
import express from 'express';
import * as middlewares from './lib/middlewares';
import { PrismaClient } from '@prisma/client';
import { setUpRoutes, setUpSubscriptions } from '@lib/utils';
import { OutboxService } from '@services/outbox/Outbox';
import { ExtendedRequest } from '@type/request';
import 'websocket-polyfill';
import relayList from './constants/relays.json';

const port = process.env.PORT || 8000;

// Instantiate prisma client
console.info('Instantiate prisma');
const prisma = new PrismaClient({
  log: [{ level: 'query', emit: 'event' }],
});

// Instantiate ndk
console.info('Instantiate NDK');
const ndk = new NDK({
  explicitRelayUrls: relayList,
});

console.info('Subscribing...');
const subscribed = setUpSubscriptions(ndk, path.join(__dirname, 'nostr'));

if (null === subscribed) {
  throw new Error('Error setting up subscriptions');
}

ndk.pool.on('relay:connect', (relay: NDKRelay) => {
  console.info('Connected to Relay', relay.url);
});

ndk.on('error', (err) => {
  console.info('Error connecting to Relay', err);
});

// Generate routes
console.info('Setting up routes...');
const routes = setUpRoutes(express.Router(), path.join(__dirname, 'rest'));

if (null === routes) {
  throw new Error('Error setting up routes');
}

// Setup context
routes.use((req, res, next) => {
  (req as ExtendedRequest).context = {
    prisma,
    outbox: new OutboxService(),
  };
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
  console.log(`Server is running on port ${port}`);
});

// Connect to Nostr
console.info('Connecting to Nostr...');
ndk.connect();
