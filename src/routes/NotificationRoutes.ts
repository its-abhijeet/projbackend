// src/routes/NotificationRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import NotificationController from '../controllers/NotificationController';
import { auth } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// ─── Protected (all logged-in users & admins) ─────────────────────────────
// List notifications
// GET /notifications
router.get(
  '/',
  auth,
  (req: Request, res: Response, next: NextFunction) => {
    notificationController.list(req, res, next).catch(next);
  }
);

// Mark a single notification as read
// PATCH /notifications/:id/read
router.patch(
  '/:id/read',
  auth,
  (req: Request, res: Response, next: NextFunction) => {
    notificationController.markRead(req, res, next).catch(next);
  }
);

// Mark all notifications as read
// PATCH /notifications/read-all
router.patch(
  '/read-all',
  auth,
  (req: Request, res: Response, next: NextFunction) => {
    notificationController.markAllRead(req, res, next).catch(next);
  }
);

export default router;
