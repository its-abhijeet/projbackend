import { S3Client } from "@aws-sdk/client-s3";
import logger from "../logger";

// Hardcode the region to ensure it's always set
const REGION = "ap-south-1";

// Get AWS credentials from environment variables or prompt user
// You need to set these environment variables with your actual AWS credentials
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Log initialization but not the credentials
logger.info(`Initializing S3 client with region: ${REGION}`);
logger.info(`AWS Access Key ID available: ${AWS_ACCESS_KEY_ID ? 'Yes' : 'No'}`);
logger.info(`AWS Secret Access Key available: ${AWS_SECRET_ACCESS_KEY ? 'Yes' : 'No'}`);

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  logger.error("AWS credentials are missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
}

export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || "",
    secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
  },
});