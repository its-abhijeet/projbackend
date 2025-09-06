import express, { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import { s3 } from "../utils/s3Client";
import { PrismaClient } from "../../generated/prisma";
import { auth } from "../middleware/auth";
import { imageUpload, docUpload } from "../middleware/uploadMiddleware";
import logger from "../logger";

const router = express.Router();
const prisma = new PrismaClient();

// CloudFront base URL (set this env var to your distribution domain, e.g. https://d123456abcdef.cloudfront.net)
const CLOUD_FRONT_URL = process.env.CLOUDFRONT_URL!;

/**
 * POST /files/upload-profile-pic
 * - auth: ensures req.token.userId is set
 * - upload.single('file'): single file in memory
 * - uploads a profile picture to S3 and returns its CloudFront URL
 */
router.post(
  "/upload-profile-pic",
  auth, // ensure req.token.userId is set
  imageUpload.single("file"), // multer
  async (req: Request, res: Response): Promise<any> => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const userId = (req as any).token.userId as string;
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/\s+/g, "_");
      const key = `profile-pics/${userId}_${timestamp}_${originalName}`;

      // 1) Upload to S3 using bucket name from environment variables
      const bucketName = process.env.S3_BUCKET_MARKETPLACE_IMAGES || "myawsbucketodoo-1";
      const region = process.env.AWS_REGION || "ap-south-1";
      
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        logger.info(`Successfully uploaded profile pic to S3: ${key}`);
      } catch (uploadError) {
        logger.error("S3 upload error details:", uploadError);
        throw uploadError;
      }

      // 2) Build the public URL
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      // 3) Persist it with Prisma (uncomment if you have a profileImage field on User)
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { profileImage: url },
      // });

      // 4) Respond to the client
      return res.json({ url });
    } catch (err) {
      console.error("Upload profile pic error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * POST /files/upload-product-images
 * - auth: ensures req.token.userId is set
 * - upload.array('images', 10): up to 10 files in memory
 * - body must include: productId
 * - uploads multiple product images to S3, persists URLs in Image table, and returns URLs
 */
router.post(
  "/upload-product-images",
  auth,
  imageUpload.array("images", 10),
  async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = (req as any).token.userId as string;
      const productId = parseInt(req.body.productId, 10);

      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid or missing productId" });
      }

      // 1) Check that product exists and belongs to this seller
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerUserId: true },
      });
      if (!product || product.sellerUserId !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to add images to this product" });
      }

      // 2) Ensure files are present
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const bucketName = process.env.S3_BUCKET_MARKETPLACE_IMAGES || "myawsbucketodoo-1";
      const region = process.env.AWS_REGION || "ap-south-1";
      
      const uploadPromises = files.map(async (file, index) => {
        const key = `seller/${userId}/${productId}/images/${index}.jpg`;
        
        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            })
          );
          logger.info(`Successfully uploaded product image to S3: ${key}`);
        } catch (uploadError) {
          logger.error("S3 upload error details:", uploadError);
          throw uploadError;
        }
        
        return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      });

      const urls = await Promise.all(uploadPromises);
        console.log('Uploaded files to S3:', urls);

      // 4) Persist in the Image table
      const records = urls.map((url) => ({ url, productId }));
      await prisma.image.createMany({ data: records });
        console.log('Saved image URLs to DB:', records);

      // 5) Return the list of image URLs
      return res.json({ images: urls });
    } catch (err) {
      console.error("Upload product images error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * POST /files/upload-verification-doc
 * - auth: ensures req.token.userId is set
 * - upload.single('file'): single file in memory
 * - uploads a verification document to S3, updates or creates a Seller record, and returns the URL
 */
router.post(
  "/upload-verification-doc",
  auth,
  docUpload.single("file"),
  async (req: Request, res: Response): Promise<any> => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      
      console.log(res)

      const userId = (req as any).token.userId as string;
      const timestamp = Date.now();
      console.log(userId)
      const originalName = req.file.originalname.replace(/\s+/g, "_");
      console.log(originalName)
      const key = `verification-docs/${userId}/${timestamp}_${originalName}`;
      console.log("key", key)

      // 1) Upload to S3 using bucket name from environment variables
      const bucketName = process.env.S3_BUCKET_USER_DOCUMENTS || "myawsbucketodoo-1";
      const region = process.env.AWS_REGION || "ap-south-1";
      
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        logger.info(`Successfully uploaded document to S3: ${key}`);
      } catch (uploadError) {
        logger.error("S3 upload error details:", uploadError);
        throw uploadError;
      }

      // 2) Build the public URL for the document
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      console.log(url)

      // 3) Update or create the Seller record
      const existingSeller = await prisma.seller.findUnique({
        where: { userId },
      });

      if (existingSeller) {
        // If seller record already exists, update the verificationDocUrl and set isDocumentVerified = false
        await prisma.seller.update({
          where: { userId },
          data: { verificationDocUrl: url },
        });
        // Also ensure user's isDocumentVerified is false until admin approves
        await prisma.user.update({
          where: { id: userId },
          data: { isDocumentVerified: false },
        });
      } else {
        // If no seller record yet, create a placeholder Seller with only the document URL
        // businessDesc and businessType can be filled later during the verify step
        await prisma.seller.create({
          data: {
            userId,
            businessDesc: "",
            businessType: "",
            verificationDocUrl: url,
          },
        });
        // Mark document as pending (isDocumentVerified remains false)
        await prisma.user.update({
          where: { id: userId },
          data: { isDocumentVerified: false },
        });
      }

      console.log("done")

      // 4) Return the verification document URL
      return res.json({ verificationDocUrl: url });
    } catch (err) {
      console.error("Upload verification doc error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;