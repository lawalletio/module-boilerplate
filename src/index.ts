import { Debugger } from 'debug';
import express, { Application } from 'express';
import * as middlewares from '@lib/middlewares';
import {
  EmptyRoutesError,
  logger,
  setUpRoutes,
  setUpSubscriptions,
} from '@lib/utils';
import { DefaultContext, ExtendedRequest } from '@type/request';
import 'websocket-polyfill';

import { getReadNDK, getWriteNDK } from '@services/ndk';
import NDK, { NDKRelay } from '@nostr-dev-kit/ndk';
import { OutboxService } from '@services/outbox';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'http';

const log: Debugger = logger.extend('index');
const warn: Debugger = log.extend('warn');

export type ModuleConfiguration<
  Context extends DefaultContext = DefaultContext,
> = Partial<{
  expressApp: Application;
  port: number;
  readNDK: NDK;
  writeNDK: NDK;
}> & {
  context: Context;
  nostrPath: string;
  restPath: string;
};

export class Module<Context extends DefaultContext = DefaultContext> {
  readonly app: Application;
  readonly context: Context;
  readonly nostrPath: string;
  readonly port: number;
  #readNDK: NDK;
  readonly restPath: string;
  #server?: Server | undefined;
  #writeNDK: NDK;

  private constructor(config: ModuleConfiguration<Context>) {
    this.nostrPath = config.nostrPath;
    this.port = config.port || 8000;
    this.#readNDK = config.readNDK || getReadNDK();
    this.restPath = config.restPath;
    this.#writeNDK = config.writeNDK || getWriteNDK();
    this.context = config.context;
    this.app = config.expressApp || this.#defaultApp();
    Object.seal(this);
  }

  static build<BuildContext extends DefaultContext = DefaultContext>(
    config:
      | { nostrPath: string; restPath: string }
      | ModuleConfiguration<BuildContext>,
  ): Module<BuildContext> {
    if ('context' in config) {
      return new Module<BuildContext>(config);
    }
    return new Module({
      context: {
        outbox: new OutboxService(getWriteNDK()),
      } as DefaultContext,
      ...config,
    }) as Module<BuildContext>;
  }

  start(): Promise<void> {
    this.#readNDK.pool.on('relay:connect', async (relay: NDKRelay) => {
      log('Connected to Relay %s', relay.url);
      log('Subscribing...');
      const subscribed = await setUpSubscriptions<Context>(
        this.context,
        this.#readNDK,
        this.#writeNDK,
        this.nostrPath,
      );

      if (null === subscribed) {
        throw new Error('Error setting up subscriptions');
      }
    });

    this.#readNDK.pool.on('relay:disconnect', (relay: NDKRelay) => {
      log('Disconnected from relay %s', relay.url);
    });

    this.#readNDK.on('error', (err) => {
      log('Error connecting to Relay', err);
    });

    // Connect to Nostr
    log('Connecting to Nostr...');
    this.#readNDK.connect().catch((e) => {
      warn('Error connecting to read relay: %o', e);
    });
    this.#writeNDK.connect().catch((e) => {
      warn('Error connecting to write relay: %o', e);
    });

    // Generate routes
    log('Setting up routes... for %O', this.restPath);
    return setUpRoutes(express.Router(), this.restPath)
      .then((routes) => {
        // Setup context
        routes.use((req, _res, next) => {
          (req as ExtendedRequest<Context>).context = this.context;
          next();
        });

        // Setup express routes
        this.app.use('/', routes);

        // Setup express routes
        this.app.use(middlewares.notFound);
        this.app.use(middlewares.errorHandler);

        //-- Start process --//

        // Start listening
        this.#server = this.app.listen(this.port, () => {
          log(`Server is running on port ${this.port}`);
        });
      })
      .catch((e: Error) => {
        if (e instanceof EmptyRoutesError) {
          log('Empty routes, this module will not be reachable by HTTP API');
        } else {
          throw e;
        }
      });
  }

  stop(): Promise<void> {
    for (const readRelay of this.#readNDK.pool.relays.values()) {
      readRelay.disconnect();
    }
    for (const writeRelay of this.#writeNDK.pool.relays.values()) {
      writeRelay.disconnect();
    }
    if (this.#server) {
      return new Promise((resolve, reject) => {
        this.#server!.close((err?: Error) => {
          if (undefined !== err) {
            reject(err);
            return;
          }
          resolve();
          this.#server = undefined;
        });
      });
    }
    return Promise.resolve();
  }

  #defaultApp(): Application {
    return express()
      .use(morgan('dev'))
      .use(helmet())
      .use(express.json())
      .use(cors());
  }
}

export * from './lib/utils';
export * from './lib/event';
export * from './services/outbox';
export * from './services/ndk';
export * from './type/request';
export * from './type/nostr';
