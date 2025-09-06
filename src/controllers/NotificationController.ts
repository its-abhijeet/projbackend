// src/controllers/NotificationController.ts

import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole } from "../../generated/prisma";
import { verifyToken } from "../lib/jwt";

const prisma = new PrismaClient();

export default class NotificationController {
  // ─── LIST NOTIFICATIONS ───────────────────────────────────────────────────
  // GET /notifications?userId=...
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticate(req, res);
      if (!payload) return;

      const { userId: queryUserId } = req.query as { userId?: string };

      let whereClause: any = {};
      if (payload.role === UserRole.ADMIN) {
        if (queryUserId) {
          whereClause.userId = queryUserId;
        }
      } else {
        // regular users see only their own
        whereClause.userId = payload.userId;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        include: {
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(
        `List notifications for user ${payload.userId} (role: ${payload.role})`
      );

      return res.json(notifications);
    } catch (err) {
      console.error("List notifications error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── MARK A SINGLE NOTIFICATION AS READ ──────────────────────────────────
  // PATCH /notifications/:id/read
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticate(req, res);
      if (!payload) return;

      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      const notif = await prisma.notification.findUnique({
        where: { id },
      });
      if (!notif) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // only admin or owner may mark read
      if (
        payload.role !== UserRole.ADMIN &&
        notif.userId !== payload.userId
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return res.json(updated);
    } catch (err) {
      console.error("Mark notification read error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── MARK ALL NOTIFICATIONS AS READ ───────────────────────────────────────
  // PATCH /notifications/read-all?userId=...
  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticate(req, res);
      if (!payload) return;

      const { userId: queryUserId } = req.query as { userId?: string };

      let whereClause: any = {};
      if (payload.role === UserRole.ADMIN) {
        if (queryUserId) {
          whereClause.userId = queryUserId;
        }
      } else {
        // regular users may only update their own
        whereClause.userId = payload.userId;
      }

      const result = await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });

      return res.json({ count: result.count });
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── HELPER: AUTHENTICATE ANY LOGGED-IN USER ──────────────────────────────
  private authenticate(req: Request, res: Response) {
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
}
