import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('Missing JWT_SECRET env var');
}
export const JWT_SECRET = rawSecret as Secret;

interface JWTPayload extends JwtPayload {
  userId: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
}

export interface CustomRequest extends Request {
  token: JWTPayload;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    logger.info(token);
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as CustomRequest).token = decoded;
    // logger.info("Hello", decoded);

    next();
  } catch (err) {
    logger.info("Error", err);
    res.status(401).send('Please authenticate');
  }
};