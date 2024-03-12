# La Wallet Module

This is a library intended to ease the quick development of backend
modules that interact with other backend.modules in the architecture described
in [lawallet.io](https://backend.lawallet.io/wallet-provider/architecture/system-architecture)

## Installation

```bash
pnpm add @lawallet/module
```

## Usage

The simplest usage is to declare the routes where the nostr listeners and rest routes will be and start the module:

```typescript
import { Module } from '@lawallet/module';

const module = Module.build({
  nostrPath: `${import.meta.dirname}/nostr`,
  restPath: `${import.meta.dirname}/rest`,
});

module.start();
```

You can also provide anything you want to the context that will be available for nostr and rest handlers by extending the `DefaultContext` type.
The following example adds a prisma client.

```typescript
import {
  Module,
  DefaultContext,
  getWriteNDK,
  OutboxService,
} from '@lawallet/module';
import { PrismaClient } from '@prisma/client';

type Context = DefaultContext & { prisma: PrismaClient };

const context: Context = {
  outbox: new OutboxService(getWriteNDK()),
  prisma: new PrismaClient(),
};

const module = Module.build<Context>({
  context,
  nostrPath: `${import.meta.dirname}/nostr`,
  restPath: `${import.meta.dirname}/rest`,
});

module.start();
```
