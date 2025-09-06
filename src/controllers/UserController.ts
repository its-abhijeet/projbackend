import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole } from "../../generated/prisma";
import { verifyToken } from "../lib/jwt";
import logger from '../logger';

const prisma = new PrismaClient();

export default class UserController {
    constructor() {}
    approve = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = this.authenticateAsAdmin(req, res);
            if (!payload) return;
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "userId is required" });
            }
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                return res.status(404).json({ error: "User not found" });
            }
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isDocumentVerified: true ,
                    role: UserRole.SELLER
                },
                include: {
                    seller: true,
                },
            });
            res.status(200).json({ message: "User Document Verified", user: updatedUser });
            // const userId = updatedUser.id;
        } catch (err) {
            logger.error("UserController error:", err);
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