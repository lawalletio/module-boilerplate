import { Response, Request, NextFunction } from 'express';
import { ErrorResponseContract } from '../../type/responses';
import { logger } from '../utils';
import { Debugger } from 'debug';

const log: Debugger = logger.extend('lib:middlewares:error');

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErrorResponseContract>,
  _next: NextFunction,
) {
  if (err instanceof SyntaxError) {
    log('Received unparsable content');
    res.status(415).send();
    return;
  }
  log('Unexpected error %O', err);
  res.status(500).send();
}
