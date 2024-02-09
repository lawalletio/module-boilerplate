import { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response, _next: NextFunction) {
  res.status(404).send();
}
