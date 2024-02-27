import { Outbox } from '../services/outbox';
import { Request } from 'express';

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
