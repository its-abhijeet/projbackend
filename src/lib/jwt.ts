// src/lib/jwt.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) throw new Error('Missing JWT_SECRET env var');
export const JWT_SECRET = rawSecret as Secret;

// Derive the correct expiresIn type from SignOptions
type ExpiresIn = NonNullable<SignOptions['expiresIn']>;
const rawExpiresIn = process.env.JWT_EXPIRES_IN;
if (!rawExpiresIn) throw new Error('Missing JWT_EXPIRES_IN env var');
const expiresIn = rawExpiresIn as ExpiresIn;

export interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

const signOptions: SignOptions = { expiresIn };

export function signToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}