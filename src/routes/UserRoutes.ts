import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { auth } from "../middleware/auth";
import { CustomRequest } from "../middleware/auth";
import UserController from "../controllers/UserController";
const router = express.Router();
const prisma = new PrismaClient();
const userController = new UserController();

// Get all users (admin only)
router.get("/", auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const customReq = req as CustomRequest;
    // Check if user is admin
    if (!customReq.token || customReq.token.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: "Access denied. Admin only endpoint."
      });
      return;
    }

    // Fetch all users with their related data
    const users = await prisma.user.findMany({
      include: {
        seller: true,
        admin: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Clean and format the user data
    const cleanUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isDocumentVerified: user.isDocumentVerified,
      createdAt: user.createdAt,
      // Include seller info if exists
      ...(user.seller && {
        businessDesc: user.seller.businessDesc,
        businessType: user.seller.businessType,
        verificationDocUrl: user.seller.verificationDocUrl,
      }),
      // Include admin info if exists
      ...(user.admin && {
        permissions: user.admin.permissions,
      })
    }));

    res.json({
      success: true,
      users: cleanUsers
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
});
router.post("/:userId/approve", auth, (req,res, next)=>{
  userController.approve(req, res, next);
});
export default router; 