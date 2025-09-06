// src/routes/AuthRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import AuthController from "../controllers/AuthController";
import { auth } from "../middleware/auth";

const router = express.Router();
const authController = new AuthController();

// Public health-check
router.get("/", (_req: Request, res: Response) => {
  res.json({ auth: "success" });
});

// Public signup/login
router.post(
  "/signup",
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.signup(req, res).catch(next)
);
router.post(
  "/login",
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.login(req, res).catch(next)
);

// Protected: must send Authorization: Bearer <token>
router.post(
  "/update-profile",
  auth,  // JWT validation
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.update_profile(req, res).catch(next)
);

router.post(
  "/verify",
  auth,  // JWT validation
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.verify(req, res).catch(next)
);

router.post(
  "/change-password",
  auth, // JWT validation
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.change_password(req, res).catch(next)
);

router.delete(
  "/",
  auth,  // JWT validation
  (req: Request, res: Response, next: NextFunction): Promise<any> =>
    authController.delete_account(req, res).catch(next)
);

export default router;
