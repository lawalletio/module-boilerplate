import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';

const handler = (req: ExtendedRequest, res: Response) => {
  return res.status(200).json({ message: 'Test POST responde' });
};

export default handler;
