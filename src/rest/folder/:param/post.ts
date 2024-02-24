import type { Response } from 'express';
import type { ExtendedRequest } from '../../../../src/type/request';

const handler = (_req: ExtendedRequest, res: Response) => {
  res.status(200).json({ message: 'Test POST response' }).send();
};

export default handler;
