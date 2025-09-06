// // src/controllers/BuyersDataController.ts
// import { Request, Response } from "express";
// import { PrismaClient, UserRole } from "../../generated/prisma";
// import { verifyToken } from "../lib/jwt";
// import bcrypt from "bcrypt";

// const prisma = new PrismaClient();

// export default class BuyerController {
//   constructor() {}

//   /**
//    * GET /buyers/:buyerId
//    * - Requires a valid JWT in Authorization header
//    * - If you pass { password } in the body, it will also verify your password via bcrypt
//    */
//   buyers = async (req: Request, res: Response) => {
//     try {
//       // 1) Check & verify JWT
//       const authHeader = req.header("Authorization");
//       if (!authHeader?.startsWith("Bearer ")) {
//         return res.status(401).json({ error: "Missing or malformed token" });
//       }
//       const token = authHeader.slice(7);
//       const payload = verifyToken(token);
//       if (!payload) {
//         return res.status(401).json({ error: "Invalid or expired token" });
//       }

//       // 2) Ensure the token’s userId matches the route param
//       const { buyerId } = req.params;
//       if (payload.userId !== buyerId) {
//         return res.status(403).json({ error: "Forbidden" });
//       }

//       // 3) Optionally verify password if provided in body
//       if (req.body.password) {
//         // The password is stored on the User model
//         const user = await prisma.user.findUnique({
//           where: { id: payload.userId },
//           select: { password: true },
//         });
//         if (!user) {
//           return res.status(404).json({ error: "User not found" });
//         }
//         const match = await bcrypt.compare(req.body.password, user.password);
//         if (!match) {
//           return res.status(401).json({ error: "Incorrect password" });
//         }
//       }

//       // 3) Authorization: allow if self or admin
//       if (payload.userId !== buyerId && payload.role !== UserRole.ADMIN) {
//         return res.status(403).json({ error: "Forbidden" });
//       }

//       // 4) Fetch and return the buyer’s profile
//       const buyerData = await prisma.buyer.findUnique({
//         where: { userId: payload.userId },
//         include: {
//           user: { select: { id: true, email: true, name: true, countryCode: true, phoneNumber: true, address: true } }
//         },
//       });
//       if (!buyerData) {
//         return res.status(404).json({ error: "Buyer not found" });
//       }

//       res.status(200).json({
//         message: "Found buyer",
//         buyer: buyerData,
//       });
//     } catch (e) {
//       logger.error("BuyerController error:", e);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   };
// }



export default class BuyerController {
  constructor() {}
}