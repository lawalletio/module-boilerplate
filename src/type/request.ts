import { Request } from 'express';
import { Outbox } from '@services/outbox';

export type DefaultContext = {
  outbox: Outbox;
};

export type ExtendedRequest<Context extends DefaultContext = DefaultContext> =
  Request & {
    context: Context;
  };

export type RestHandler = {
  (req: ExtendedRequest, res: Response): Promise<void>;
};
