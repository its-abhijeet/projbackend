// src/controllers/BuyersDataController.ts
import { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import logger from '../logger';

const prisma = new PrismaClient();

export default class ChatLeadController {
  storeLead = async (req: Request, res: Response) => {
    try {
      const { companyName, userName, phoneNumber } = req.body;
      logger.info('Incoming body:', req.body); 

      // Correctly nest your fields under `data`
      const lead = await prisma.chatLead.create({
        data: {
          companyName,
          userName,
          phoneNumber,
        },
      });

      logger.info("ChatLeadController.storeLead data:", { companyName, userName, phoneNumber });
      return res.status(201).json({
        success: true,
        message: "Lead stored successfully",
        data: lead,
      });
    } catch (e) {
      logger.error("ChatLeadController error:", e);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  };
}
