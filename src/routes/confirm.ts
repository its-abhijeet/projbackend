// src/pages/api/confirm.ts

import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from "../../generated/prisma";
import { verifyToken } from '../lib/jwt';
import { sendEmail } from '../lib/directSendgrid';

const prisma = new PrismaClient();

const router = express.Router();

router.get('/', async (req: Request, res: Response): Promise<any> => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Missing or invalid token');
  }

  // Verify and decode the token
  const payload = verifyToken(token);
  if (!payload) {
    return res
      .status(400)
      .send('Invalid or expired token. Please register again.');
  }

  const { userId } = payload;

  // Ensure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).send('User not found');
  }
  if (user.isEmailVerified) {
    return res.status(400).send('Email is already confirmed');
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to VelebitGreen!",
    template: "welcome",
    context: { name: user.name },
  });

  return res.status(200).send('Email confirmed! You may now log in.');

  // return res.redirect(302, '/confirmed');
  // return res.end();
});
// src/pages/api/confirm.ts

export default router;