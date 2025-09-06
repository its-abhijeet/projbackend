// src/controllers/ProductController.ts

import e, { Request, Response, NextFunction } from "express";
import {
  PrismaClient,
  UserRole,
  Unit,
  NotificationType,
} from "../../generated/prisma";
import { verifyToken } from "../lib/jwt";
import { sendEmail } from "../lib/directSendgrid";
import { FRONTEND_URL } from "../constants/apiConstants";
import logger from "../logger";

const prisma = new PrismaClient();

export default class ProductController {
  // ─── CREATE PRODUCT ──────────────────────────────────────────────────────
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsSeller(req, res);
      if (!payload) return;

      const {
        product_name,
        product_price,
        product_currency,
        product_qty,
        product_unit,
        product_category,
        product_country,
        product_color,
        product_source_material,
        product_batch_size,
        product_minimum_order_quantity,
        product_application,
        product_desc,
        product_additional_notes,
      } = req.body;

      const unitValue = product_unit as Unit;

      const product = await prisma.product.create({
        data: {
          name:            product_name,
          price:           product_price,
          currency:        product_currency,
          quantity:        product_qty,
          unit:            unitValue,
          category:        product_category,
          country:         product_country,
          color:          product_color,
          sourceMaterial: product_source_material,
          batchSize:      product_batch_size,
          minimumOrderQuantity: product_minimum_order_quantity,
          application:     product_application,
          description:     product_desc,
          additionalNotes: product_additional_notes,
          seller:          { connect: { userId: payload.userId } },
          isApproved:      0,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      // 1) record the notification
      await prisma.notification.create({
        data: {
          userId:    payload.userId,
          productId: product.id,
          type:      NotificationType.PRODUCT_CREATED,
        },
      });

      // 2) then send the email
      sendEmail({
        to:       user?.email || "",
        subject:  `New Product Added | ${product.name}`,
        template: "addproductpending",
        context:  { userName: user?.name, ...product },
      });

      return res.status(201).json({ message: "Product added", product });
    } catch (err) {
      logger.info("Product create error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── UPDATE PRODUCT ──────────────────────────────────────────────────────
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsSeller(req, res);
      if (!payload) return;

      const productId = this.parseProductId(req, res);
      if (productId === null) return;

      const existing = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!existing?.sellerUserId) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (existing.sellerUserId !== payload.userId) {
        return res.status(403).json({ error: "You do not own this product" });
      }

      const {
        product_name,
        product_price,
        product_currency,
        product_qty,
        product_unit,
        product_category,
        product_country,
        product_color,
        product_source_material,
        product_batch_size,
        product_minimum_order_quantity,
        product_application,
        product_desc,
        product_additional_notes,
      } = req.body;

      const unitValue = product_unit as Unit;

      const updated = await prisma.product.update({
        where: { id: productId },
        data: {
          name:            product_name,
          price:           product_price,
          currency:        product_currency,
          quantity:        product_qty,
          unit:            unitValue,
          category:        product_category,
          country:         product_country,
          color:          product_color,
          sourceMaterial: product_source_material,
          batchSize:      product_batch_size,
          minimumOrderQuantity: product_minimum_order_quantity,
          application:     product_application,
          description:     product_desc,
          additionalNotes: product_additional_notes,
          isApproved:      0,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      // record notification
      await prisma.notification.create({
        data: {
          userId:    payload.userId,
          productId: updated.id,
          type:      NotificationType.PRODUCT_UPDATED,
        },
      });

      sendEmail({
        to:       user?.email || "",
        subject:  `Product Updated | ${updated.name}`,
        template: "updateproduct",
        context:  { userName: user?.name, updated, existing },
      });

      return res.json({ message: "Product updated", product: updated });
    } catch (err) {
      logger.info("Product update error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── DELETE PRODUCT ──────────────────────────────────────────────────────
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsSeller(req, res);
      if (!payload) return;

      const productId = this.parseProductId(req, res);
      if (productId === null) return;

      const existing = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!existing?.sellerUserId) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (existing.sellerUserId !== payload.userId) {
        return res.status(403).json({ error: "You do not own this product" });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      // record the delete notification BEFORE actual deletion
      await prisma.notification.create({
        data: {
          userId:    payload.userId,
          productId: existing.id,
          type:      NotificationType.PRODUCT_DELETED,
        },
      });

const {
        product_name,
        product_price,
        product_currency,
        product_qty,
        product_unit,
        product_category,
        product_country,
        product_color,
        product_source_material,
        product_batch_size,
        product_minimum_order_quantity,
        product_application,
        product_desc,
        product_additional_notes,
      } = req.body;

      const unitValue = product_unit as Unit;

      const deleted = await prisma.product.update({
        where: { id: productId },
        data: {
          name:            product_name,
          price:           product_price,
          currency:        product_currency,
          quantity:        product_qty,
          unit:            unitValue,
          category:        product_category,
          country:         product_country,
          color:          product_color,
          sourceMaterial: product_source_material,
          batchSize:      product_batch_size,
          minimumOrderQuantity: product_minimum_order_quantity,
          application:     product_application,
          description:     product_desc,
          additionalNotes: product_additional_notes,
          isApproved:      -2,
          deletedAt:       new Date(), // set deletion timestamp
        },
      });

      // prepare deletion timestamp for email
      const now = new Date();
      const hours12 = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const day   = now.getDate().toString().padStart(2, '0');
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const month = monthNames[now.getMonth()];
      const year  = now.getFullYear();
      const formattedDate = `${hours12}:${minutes} ${ampm}, ${day} ${month} ${year}`;

      sendEmail({
        to:       user?.email || "",
        subject:  `Product Deleted | ${existing.name}`,
        template: "deleteproduct",
        context:  {
          userName:     user?.name,
          productId,
          productName:  existing.name,
          deletionDate: formattedDate,
        },
      });

      return res.json({ message: "Product deleted" });
    } catch (err) {
      logger.info("Product delete error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── VIEW SINGLE PRODUCT ─────────────────────────────────────────────────
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = this.parseProductId(req, res);
      if (productId === null) return;

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          seller: {
            select: { userId: true, user:true, businessDesc:true, businessType:true },
          },
        },
      });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json(product);
    } catch (err) {
      logger.info("Get product error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ALL APPROVED PRODUCTS ───────────────────────────────────────────
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const filter: any = { isApproved: 1 };

      // if admin, show all (pending too)
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const payload = verifyToken(token);
        if (payload?.role === UserRole.ADMIN) {
          delete filter.isApproved;
        }
      }

      const products = await prisma.product.findMany({
        where: filter,
        include: {
          images: true,
          seller: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phoneNumber: true,
                  countryCode: true,
                  address: true,
                  isEmailVerified: true,
                  isDocumentVerified: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(products);
    } catch (err) {
      logger.info("List all products error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST PRODUCTS BY SELLER ─────────────────────────────────────────────
  async listBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerUserId = req.params.sellerUserId;
      if (!sellerUserId) {
        return res.status(400).json({ error: "Missing sellerUserId parameter" });
      }
      const products = await prisma.product.findMany({
        where: { sellerUserId },
        include: { images: true },
      });
      return res.json(products);
    } catch (err) {
      logger.info("List by seller error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ALL PRODUCTS EXCEPT A GIVEN SELLER'S (PUBLIC) ──────────────────
  async listProductExceptSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerUserId = req.params.sellerUserId;
      if (!sellerUserId) {
        return res.status(400).json({ error: "Missing sellerUserId parameter" });
      }
      const products = await prisma.product.findMany({
        where: { sellerUserId: { not: sellerUserId } },
        include: { images: true },
      });
      return res.json(products);
    } catch (err) {
      logger.info("List products except seller error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ALL PENDING PRODUCTS (ADMIN) ───────────────────────────────────
  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsAdmin(req, res);
      if (!payload) return;

      const products = await prisma.product.findMany({
        where: { isApproved: 0 },
        include: {
          images: true,
          seller: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phoneNumber: true,
                  countryCode: true,
                  address: true,
                  isEmailVerified: true,
                  isDocumentVerified: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(products);
    } catch (err) {
      logger.info("List pending products error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── APPROVE PRODUCT (ADMIN) ──────────────────────────────────────────────
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsAdmin(req, res);
      if (!payload) return;

      const productId = this.parseProductId(req, res);
      if (productId === null) return;

      const existing = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: {
            include: {
              user: {
                select: { email: true, name: true },
              },
            },
          },
        },
      });
      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isApproved: 1 },
        include: {
          seller: {
            include: {
              user: {
                select: { email: true, name: true },
              },
            },
          },
        },
      });

      const sellerId = updated.seller.userId;
      const sellerUser = updated.seller.user;

      // record notification
      await prisma.notification.create({
        data: {
          userId:    sellerId,
          productId: updated.id,
          type:      NotificationType.PRODUCT_APPROVED,
        },
      });

      const actionUrl = `${FRONTEND_URL}/marketplace/${updated.id}`;
      sendEmail({
        to:       sellerUser.email,
        subject:  `Product Approved | ${updated.name}`,
        template: "addproductapproved",
        context:  {
          userName:    sellerUser.name,
          productName: updated.name,
          productId:   updated.id,
          actionUrl,
        },
      });

      return res.json({
        message: "Product approved successfully",
        product: updated,
      });
    } catch (err) {
      logger.info("Approve product error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── REJECT PRODUCT (ADMIN) ───────────────────────────────────────────────
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = this.authenticateAsAdmin(req, res);
      if (!payload) return;

      const productId = this.parseProductId(req, res);
      if (productId === null) return;

      const existing = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: {
            include: {
              user: {
                select: { email: true, name: true },
              },
            },
          },
        },
      });
      if (!existing) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isApproved: -1 },
        include: {
          seller: {
            include: {
              user: {
                select: { email: true, name: true },
              },
            },
          },
        },
      });

      const sellerId = updated.seller.userId;
      const sellerUser = updated.seller.user;

      // record notification
      await prisma.notification.create({
        data: {
          userId:    sellerId,
          productId: updated.id,
          type:      NotificationType.PRODUCT_REJECTED,
        },
      });

      sendEmail({
        to:       sellerUser.email,
        subject:  `Product Rejected | ${updated.name}`,
        template: "rejectproduct",
        context:  {
          userName:    sellerUser.name,
          productName: updated.name,
          productId:   updated.id,
        },
      });

      return res.json({
        message: "Product marked as rejected",
        productId: updated.id,
        productName: updated.name,
        seller: {
          name: sellerUser.name,
          email: sellerUser.email,
        },
      });
    } catch (err) {
      logger.info("Reject product error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── LIST ALL Rejected PRODUCTS ───────────────────────────────────────────
  async listAllRejected(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed token" });
      }
      const payload = verifyToken(authHeader.slice(7));
      if (!payload || payload.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const products = await prisma.product.findMany({
        where: { isApproved: -1 },
        include: {
          images: true,
          seller: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phoneNumber: true,
                  countryCode: true,
                  address: true,
                  isEmailVerified: true,
                  isDocumentVerified: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(products);
    } catch (err) {
      logger.info("List rejected products error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private authenticateAsSeller(req: Request, res: Response) {
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
    if (
      payload.role !== UserRole.SELLER &&
      payload.role !== UserRole.ADMIN
    ) {
      res
        .status(403)
        .json({ error: "Only sellers or admins may perform this operation" });
      return null;
    }
    return payload;
  }

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

  private parseProductId(req: Request, res: Response): number | null {
    const id = Number(req.params.productId);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid productId" });
      return null;
    }
    return id;
  }
}
