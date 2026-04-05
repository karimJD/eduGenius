const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
require('dotenv').config();

const region = process.env.AWS_REGION;
if (!region) {
  throw new Error('AWS_REGION is not defined in environment variables');
}

const { NodeHttpHandler } = require("@smithy/node-http-handler");

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10000,
    socketTimeout: 10000,
  }),
  maxAttempts: 3,
});

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<string>} The public URL of the uploaded file
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined in environment variables');
  }

  const key = `courses/${Date.now()}-${fileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  await upload.done();

  // Construct the public URL
  // Note: This assumes the bucket is public. If not, use CloudFront or signed URLs.
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

module.exports = { uploadToS3 };
