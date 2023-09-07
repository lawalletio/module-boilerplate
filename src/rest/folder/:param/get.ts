import type { Response } from 'express';
import type { ExtendedRequest } from 'src/types/request';

const handler = (req: ExtendedRequest, res: Response) => {
  return res.status(200).json({ message: 'Test GET responde' });
};

export default handler;
