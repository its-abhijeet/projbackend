// src/controllers/EnquiryController.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole } from "../../generated/prisma";
import { verifyToken } from "../lib/jwt";
import logger from "../logger";

const prisma = new PrismaClient();

export default class EnquiryController {
  // ─── SEND ENQUIRY ────────────────────────────────────────────────────────
  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateUser(req, res);
      if (!payload) return;

      const { productId, message } = req.body;
      const pid = Number(productId);
      if (Number.isNaN(pid) || !message) {
        return res.status(400).json({ error: "productId and message are required" });
      }

      const enquiry = await prisma.enquiry.create({
        data: {
          product: { connect: { id: pid } },
          user:    { connect: { id: payload.userId } },
          message,
        },
      });

      return res.status(201).json({ message: "Enquiry sent", enquiry });
    } catch (err) {
      logger.info("Enquiry send error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ALL ENQUIRIES (ADMIN) ─────────────────────────────────────────
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsAdmin(req, res);
      if (!payload) return;

      const enquiries = await prisma.enquiry.findMany({
        include: {
          product: true,
          user:    { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(enquiries);
    } catch (err) {
      logger.info("List all enquiries error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ENQUIRIES BY PRODUCT ──────────────────────────────────────────
  async listByProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const pid = Number(req.params.productId);
      if (Number.isNaN(pid)) {
        return res.status(400).json({ error: "Invalid productId" });
      }

      const enquiries = await prisma.enquiry.findMany({
        where:   { productId: pid },
        include: {
          user:    { select: { id: true, name: true, email: true } },
          product: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(enquiries);
    } catch (err) {
      logger.info("List enquiries by product error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ENQUIRIES BY USER ─────────────────────────────────────────────
  async listByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.params.userId ?? this.authenticateUser(req, res)?.userId;
      if (!uid) return; // errors already sent by authenticateUser

      const enquiries = await prisma.enquiry.findMany({
        where:   { userId: uid },
        include: {
          product: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(enquiries);
    } catch (err) {
      logger.info("List enquiries by user error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ENQUIRIES BY SELLER ───────────────────────────────────────────
  async listBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsSeller(req, res);
      if (!payload) return;

      const enquiries = await prisma.enquiry.findMany({
        where: {
          product: {
            sellerUserId: payload.userId,
          },
        },
        include: {
          user:    { select: { id: true, name: true, email: true } },
          product: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(enquiries);
    } catch (err) {
      logger.info("List enquiries by seller error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────
  private authenticateUser(req: Request, res: Response) {
    const auth = req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or malformed token" });
      return null;
    }
    const payload = verifyToken(auth.slice(7));
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return null;
    }
    return payload;
  }

  private authenticateAsSeller(req: Request, res: Response) {
    const payload = this.authenticateUser(req, res);
    if (!payload) return null;
    if (
      payload.role !== UserRole.SELLER &&
      payload.role !== UserRole.ADMIN
    ) {
      res.status(403).json({ error: "Only sellers or admins may perform this operation" });
      return null;
    }
    return payload;
  }

  private authenticateAsAdmin(req: Request, res: Response) {
    const payload = this.authenticateUser(req, res);
    if (!payload) return null;
    if (payload.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Only admins may perform this operation" });
      return null;
    }
    return payload;
  }
}
