// src/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "../generated/prisma";
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Odoo Backend API' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ 
    success: false,
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
