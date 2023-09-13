import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';

const handler = (req: ExtendedRequest, res: Response) => {
  console.dir(req.params);
  return res.status(200).json({ message: 'Test GET responde' });
};

export default handler;
