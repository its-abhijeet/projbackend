// src/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "../generated/prisma";
import { auth } from './middleware/auth';
import {
  AuthRouter,
  SellerRouter,
  ProductRouter,
  BuyerRouter,
  ChatLeadRouter,
  NotificationRouter,
  EnquiryRouter,
} from "./routes";
import uploadRouter from './routes/upload';
import confirmRouter from './routes/confirm';
import UserRouter from './routes/UserRoutes';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors({
  origin: ['https://green-cycle-hub-frontend.vercel.app',
    'https://green-cycle-hub-admin.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    '*',
  ], 
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization', 'x-frontend-type']
}))

/**
 * Example route to create a buyer+user.
 * Call like:
 * GET /hello/123?emailId=foo@bar.com&countryCode=%2B1&phoneNumber=5551234&fullName=Alice
 */

// Auth routes (public)
app.use("/auth", AuthRouter);

// Protected application routes
app.use("/products", ProductRouter);
app.use("/seller", auth, SellerRouter);
app.use("/buyer", auth, BuyerRouter);
app.use('/files', uploadRouter);
app.use("/chatlead", ChatLeadRouter);
app.use("/confirm", confirmRouter);
app.use("/notifications", NotificationRouter);
app.use("/enquiry", EnquiryRouter);
// User routes (admin only)
app.use("/users", auth,UserRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ 
    success: false,
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  logger.info(`listening on port ${port}`);
});
