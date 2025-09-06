// src/controllers/SellersDataController.ts
import { Request, Response } from "express";
import { PrismaClient, UserRole } from "../../generated/prisma";
import { verifyToken } from "../lib/jwt";
import logger from '../logger';

const prisma = new PrismaClient();

export default class SellerController {
  constructor() {}

  /**
   * GET /sellers/:sellerId
   * - Requires a valid JWT
   * - Only the seller themself or an admin may view this data
   */
  sellers = async (req: Request, res: Response) => {
    try {
      // 1. Verify JWT
      const auth = req.header("Authorization");
      if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed token" });
      }
      const token = auth.slice(7);
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // 2. Parse param
      const sellerId = req.params.sellerId;
      if (!sellerId) {
        return res.status(400).json({ error: "sellerId is required" });
      }

      // 3. Fetch seller + products
      const sellerData = await prisma.seller.findUnique({
        where: { userId: sellerId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              countryCode: true,
              phoneNumber: true,
              address: true,
            },
          },
          products: true,
        },
      });
      if (!sellerData) {
        return res.status(404).json({ error: "Seller not found" });
      }

      res.status(200).json({ message: "Found seller", seller: sellerData });
    } catch (err) {
      logger.error("SellerController error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
    private authenticateAsAdmin(req: Request, res: Response) {
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
    if (payload.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Only admins may perform this operation" });
      return null;
    }
    return payload;
  }
}