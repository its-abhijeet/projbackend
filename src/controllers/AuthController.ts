// src/controllers/AuthController.ts

import { Request, Response } from "express";
import { PrismaClient, $Enums } from "../../generated/prisma";
import bcrypt from "bcrypt";
import { signToken } from "../lib/jwt";
// Import the direct SendGrid email service
import { sendConfirmationEmail, sendEmail } from "../lib/directSendgrid";
import logger from '../logger';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export default class AuthController {
  // ─── SIGNUP (always as regular USER) ──────────────────────────────────────
  async signup(req: Request, res: Response) {
    // 1) Destructure only the fields needed for a regular user
    const {
      name,
      email,
      password,
      countryCode,
      phoneNumber,
      address,
    } = req.body as {
      name: string;
      email: string;
      password: string;
      countryCode?: string;
      phoneNumber?: string;
      address: string;
    };

    // 2) Validate required fields
    if (!name || !email || !password || !address) {
      return res.status(400).json({
        error: "Fields (name, email, password, address) are required",
      });
    }

    try {
      // 3) Hash the password
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);

      // 4) Create the User record with role = USER
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          address,
          countryCode: countryCode || undefined,
          phoneNumber: phoneNumber || undefined,
          role: $Enums.UserRole.USER,
          isEmailVerified: false,
        },
      });

      // 5) Issue a JWT for the new user
      const token = signToken({ userId: user.id, role: user.role });
      console.log(token)
      console.log(user)
      // 6) Send welcome email
      // await sendEmail({
      //   to: user.email,
      //   subject: "Welcome to VelebitGreen!",
      //   template: "confirm",
      //   context: { name: user.name },
      // });

      try {
      await sendConfirmationEmail({
        to: user.email,
          subject: "Confirm your email address | EcoFind",
        template: "confirm",
        context: { name: user.name},
      }, token);
      } catch (emailError) {
        // Log the error but continue with signup process
        logger.error("Failed to send confirmation email:", emailError);
        // We'll still create the user but note that email wasn't sent
      }

      // 7) Return the user object (excluding password)
      return res.status(201).json({
        message: "USER registered",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          countryCode: user.countryCode || null,
          phoneNumber: user.phoneNumber || null,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          isDocumentVerified: user.isDocumentVerified,
        },
      });
    } catch (e: any) {
      logger.error("Signup error:", e);
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Email already in use" });
      }
      return res.status(500).json({ error: "Signup failed" });
    }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async login(req: Request, res: Response) {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      // Improved structured logging
      logger.info({ email }, 'Login attempt');
      logger.info({ headers: req.headers }, 'All headers');
      
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        logger.info({ email }, 'User not found');
        return res.status(404).json({ error: "User not found" });
      }

      logger.info(
        { email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
        'Found user'
      );

      // Check request source - handle header case-insensitively
      const adminHeader = (req.headers['x-frontend-type'] || req.headers['X-Frontend-Type']);
      const isAdminFrontend = adminHeader === 'admin';
      logger.info({ adminHeader }, 'Admin header value');
      logger.info({ isAdminFrontend }, 'Is admin frontend');

      // Case 1: Regular frontend request (seller/user)
      if (!isAdminFrontend) {
        if (user.role === $Enums.UserRole.ADMIN) {
          logger.info({ email }, 'Admin tried to login through regular frontend');
          return res.status(403).json({ 
            error: "This email belongs to an admin account and cannot be used to login through this portal" 
          });
        }
      }
      // Case 2: Admin frontend request
      else {
        if (user.role !== $Enums.UserRole.ADMIN) {
          logger.info({ email }, 'Non-admin tried to login through admin frontend');
          return res.status(403).json({
            error: "Only admin accounts can login through the admin portal"
          });
        }
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        logger.info({ email }, 'Password mismatch for user');
        return res.status(401).json({ error: "Incorrect password" });
      }

      if (user.isEmailVerified === false) {
        logger.info({ email }, 'Unverified email attempt');
        return res.status(403).json({ error: "Email not verified" });
      }

      const token = signToken({ userId: user.id, role: user.role });
      logger.info({ email, role: user.role }, 'Login successful for user');

      // If the user is a SELLER, include seller details
      let sellerInfo: Record<string, any> = {};
      if (user.role === $Enums.UserRole.SELLER) {
        const seller = await prisma.seller.findUnique({
          where: { userId: user.id },
        });
        if (seller) {
          sellerInfo = {
            businessDesc: seller.businessDesc,
            businessType: seller.businessType,
            verificationDocUrl: seller.verificationDocUrl,
          };
        }
      }

      // not required bcoz printing very large verification doc url
      // logger.info(
      //   { userId: user.id, user: { ...user, ...sellerInfo } },
      //   'Login response user object'
      // );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
          address: user.address,
          countryCode: user.countryCode,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          isDocumentVerified: user.isDocumentVerified,
          ...sellerInfo,
        },
      });
    } catch (e) {
      logger.error("Login error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── VERIFY AS SELLER ──────────────────────────────────────────────────────
  async verify(req: Request, res: Response): Promise<void> {
    const payload = (req as any).token as {
      userId: string;
      role: $Enums.UserRole;
    };
    const {
      businessDesc,
      businessType,
      verificationDocUrl,
    } = req.body as {
      businessDesc?: string;
      businessType?: string;
      verificationDocUrl?: string;
    };

    console.log(req.body)
    console.log("hello")

    logger.info("Verifying as seller with payload:", payload);
    logger.info(payload);
    console.log(req.body)

    // 1) Ensure the user is authenticated
    if (!payload?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // 2) Only a regular USER can verify to become a SELLER
    if (payload.role !== $Enums.UserRole.USER) {
      res.status(400).json({ error: "Only a regular user can verify as seller" });
      return;
    }

    // 3) Validate seller‐specific fields
    if (!businessDesc || !businessType || !verificationDocUrl) {
      res.status(400).json({
        error:
          "Fields (businessDesc, businessType, verificationDocUrl) are required to verify as seller",
      });
      return;
    }

    try {
      // 4) Update User: set role = SELLER and isDocumentVerified = true
      const updatedUser = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          role: $Enums.UserRole.SELLER,
          isDocumentVerified: true,
        },
      });

      // 5) Create corresponding Seller record
      const seller = await prisma.seller.update({
        where: { userId: payload.userId },
        data: {
          businessDesc,
          businessType,
          verificationDocUrl,
        },
      });

      logger.info("Seller created:", seller);
      logger.info("Updated user:", updatedUser);

      // 6) Return the updated user with seller info
      res.json({
        message: "User verified as seller",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          address: updatedUser.address,
          countryCode: updatedUser.countryCode,
          phoneNumber: updatedUser.phoneNumber,
          isEmailVerified: updatedUser.isEmailVerified,
          isDocumentVerified: updatedUser.isDocumentVerified,
          businessDesc: seller.businessDesc,
          businessType: seller.businessType,
        },
      });
    } catch (e) {
      console.log(e)
      logger.error("Verification error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── UPDATE PROFILE ───────────────────────────────────────────────────────
  async update_profile(req: Request, res: Response): Promise<void> {
    const payload = (req as any).token as {
      userId: string;
      role: $Enums.UserRole;
    };
    const {
      name,
      email,
      countryCode,
      phoneNumber,
      address,
      businessDesc,       // ← for sellers
      businessType,       // ← for sellers
      verificationDocUrl, // ← for sellers
    } = req.body as {
      name?: string;
      email?: string;
      countryCode?: string;
      phoneNumber?: string;
      address?: string;
      businessDesc?: string;
      businessType?: string;
      verificationDocUrl?: string;
    };

    // 1) Ensure the user is authenticated
    if (!payload?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      // 2) Fetch existing user
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // 3) Build update data for User
      const userData: Partial<typeof user> = {};
      if (name) userData.name = name;
      if (email && email !== user.email) {
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
          res.status(409).json({ error: "Email already in use" });
          return;
        }
        userData.email = email;
      }
      if (countryCode) userData.countryCode = countryCode;
      if (phoneNumber) userData.phoneNumber = phoneNumber;
      if (address) userData.address = address;

      // 4) Update User row
      const updated = await prisma.user.update({
        where: { id: payload.userId },
        data: userData,
      });

      // 5) If seller, update seller‐specific fields
      let sellerInfo: Record<string, any> = {};
      if (payload.role === $Enums.UserRole.SELLER) {
        const sellerUpdateData: Record<string, any> = {};
        if (businessDesc) sellerUpdateData.businessDesc = businessDesc;
        if (businessType) sellerUpdateData.businessType = businessType;
        if (verificationDocUrl) sellerUpdateData.verificationDocUrl = verificationDocUrl;

        if (Object.keys(sellerUpdateData).length > 0) {
          const seller = await prisma.seller.update({
            where: { userId: payload.userId },
            data: sellerUpdateData,
          });
          sellerInfo = {
            businessDesc: seller.businessDesc,
            businessType: seller.businessType,
            verificationDocUrl: seller.verificationDocUrl,
          };
        }
      }

      // 6) Return the updated profile
      res.json({
        message: "Profile updated",
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          countryCode: updated.countryCode,
          phoneNumber: updated.phoneNumber,
          address: updated.address,
          role: updated.role,
          isEmailVerified: updated.isEmailVerified,
          isDocumentVerified: updated.isDocumentVerified,
          ...sellerInfo,
        },
      });
    } catch (e) {
      logger.error("Update error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── DELETE ACCOUNT ────────────────────────────────────────────────────────
  async delete_account(req: Request, res: Response): Promise<void> {
    // 1) Extract userId & role from the JWT payload
    const payload = (req as any).token as {
      userId: string;
      role: $Enums.UserRole;
    };
    if (!payload?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      // 2) Delete any role‐specific record first
      switch (payload.role) {
        case $Enums.UserRole.SELLER:
          await prisma.seller.delete({ where: { userId: payload.userId } });
          break;
        case $Enums.UserRole.ADMIN:
          await prisma.admin.delete({ where: { userId: payload.userId } });
          break;
        // USERS have no separate table
      }

      // 3) Delete the user
      await prisma.user.delete({ where: { id: payload.userId } });

      // 4) Respond
      res.json({ message: "Account deleted successfully" });
    } catch (e) {
      logger.error("Delete account error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  async change_password(req: Request, res: Response): Promise<void> {
    // 1) Extract userId from JWT payload
    const payload = (req as any).token as { userId: string };
    if (!payload?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // 2) Get current and new password from request body
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Both current and new password are required" });
      return;
    }

    try {
      // 3) Fetch user from DB
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // 4) Compare current password
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      // 5) Hash new password and update
      const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { password: hashed },
      });

      // 6) Respond with success message
      logger.info("Password changed successfully for user:", user.id);
      
      try {
        await sendEmail({
        to: user.email,
        subject: "Password Changed Successfully",
        template: "password",
        context: { userName: user.name, changeDate: new Date().toLocaleString() },
      });
      } catch (emailError) {
        // Log the error but continue with password change process
        logger.error("Failed to send password change email:", emailError);
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (e) {
      logger.error("Change password error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
