import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';

const handler = (_req: ExtendedRequest, res: Response) => {
  res.status(200).json({ message: 'Test POST responde' }).send();
};

export default handler;
