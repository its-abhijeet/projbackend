// src/routes/EnquiryRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import EnquiryController from '../controllers/EnquiryController';
import { auth } from '../middleware/auth';

const router = Router();
const enquiryController = new EnquiryController();

// ─── SEND ENQUIRY ─────────────────────────────────────────────────────────
// POST /enquiries
router.post(
  '/',
  auth, // JWT validation (any authenticated user)
  (req: Request, res: Response, next: NextFunction) => {
    enquiryController.send(req, res, next).catch(next);
  }
);

// ─── PUBLIC: LIST ENQUIRIES FOR A PRODUCT ─────────────────────────────────
// GET /enquiries/product/:productId
router.get(
  '/product/:productId',
  (req: Request, res: Response, next: NextFunction) => {
    enquiryController.listByProduct(req, res, next).catch(next);
  }
);

// ─── AUTHENTICATED: LIST YOUR OWN ENQUIRIES ────────────────────────────────
// GET /enquiries/user
router.get(
  '/user',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    enquiryController.listByUser(req, res, next).catch(next);
  }
);

// ─── ADMIN: LIST ALL ENQUIRIES ─────────────────────────────────────────────
// GET /enquiries
router.get(
  '/',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    enquiryController.listAll(req, res, next).catch(next);
  }
);

// ─── SELLER: LIST ALL ENQUIRIES FOR YOUR PRODUCTS ─────────────────────────
// GET /enquiries/seller
router.get(
  '/seller',
  auth, // JWT validation (seller or admin)
  (req: Request, res: Response, next: NextFunction) => {
    enquiryController.listBySeller(req, res, next).catch(next);
  }
);

export default router;