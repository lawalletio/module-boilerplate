import { Request, Response } from 'express';

const handler = (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Test GET responde' });
};

export default handler;
