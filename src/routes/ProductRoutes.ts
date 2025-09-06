// src/routes/ProductRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import ProductController from '../controllers/ProductController';
import { auth } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

// ─── Public endpoints ──────────────────────────────────────────────────────
// List all products
// GET /products
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    productController.listAll(req, res, next).catch(next);
  }
);

// List products by a specific seller
// GET /products/seller/:sellerUserId
router.get(
  '/seller/:sellerUserId',
  (req: Request, res: Response, next: NextFunction) => {
    productController.listBySeller(req, res, next).catch(next);
  }
);

router.get(
  '/except/:sellerUserId',
  (req: Request, res: Response, next: NextFunction) => {
    productController.listProductExceptSeller(req, res, next).catch(next);
  }
);

// ─── Protected (Admin-only) endpoints ─────────────────────────────────────
// Approve a product
// POST /products/:productId/approve
router.post(
  '/:productId/approve',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.approve(req, res, next).catch(next);
  }
);

// Reject a product
// POST /products/:productId/reject
router.post(
  '/:productId/reject',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.reject(req, res, next).catch(next);
  }
);

router.get(
  '/rejected',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.listAllRejected(req, res, next).catch(next);
  }
);

router.get(
  '/pending',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.listPending(req, res, next).catch(next);
  }
);



// ─── Protected (Seller-only) endpoints ─────────────────────────────────────
// Create a new product
// POST /products
router.post(
  '/',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.create(req, res, next).catch(next);
  }
);

// Edit an existing product
// PUT /products/:productId
router.put(
  '/:productId',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.update(req, res, next).catch(next);
  }
);

// Delete a product
// DELETE /products/:productId
router.delete(
  '/:productId',
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction) => {
    productController.delete(req, res, next).catch(next);
  }
);

// Get a single product by ID
// GET /products/:productId
router.get(
  '/:productId',
  (req: Request, res: Response, next: NextFunction) => {
    productController.getOne(req, res, next).catch(next);
  }
);



export default router;