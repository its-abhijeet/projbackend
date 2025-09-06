// src/routes/ChatLeadRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import logger from '../logger';

const router = Router();
const prisma = new PrismaClient();

router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise <any> => {
    try {
      const { companyName, userName, phoneNumber } = req.body;
      logger.info('Incoming body:', req.body);

      const lead = await prisma.chatLead.create({
        data: { companyName, userName, phoneNumber },
      });

      logger.info(
        'ChatLeadRoutes: stored lead:',
        { companyName, userName, phoneNumber }
      );
      return res.status(201).json({
        success: true,
        message: 'Lead stored successfully',
        data: lead,
      });
    } catch (e) {
      logger.info('ChatLeadRoutes error:', e);
      return res
        .status(500)
        .json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;