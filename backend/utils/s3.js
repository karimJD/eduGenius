const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
const fs = require('fs');
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
const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = 'courses') => {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined in environment variables');
  }

  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
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
  } catch (error) {
    console.warn("S3 Upload failed, falling back to local storage. Error:", error.message);
    
    // Fallback to local storage
    try {
      const uploadDir = path.join(__dirname, '..', 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const localFileName = `${Date.now()}-${fileName}`;
      const filePath = path.join(uploadDir, localFileName);
      
      fs.writeFileSync(filePath, fileBuffer);
      
      return `/uploads/${folder}/${localFileName}`;
    } catch (fsError) {
      console.error("Local storage fallback failed:", fsError.message);
      return null;
    }
  }
};

/**
 * Get an object from S3 by key (for server-side proxy)
 * @param {string} key  e.g. 'announcements/1234-photo.jpg'
 * @returns {Promise<{stream: ReadableStream, contentType: string}>}
 */
const getS3Object = async (key) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) throw new Error('S3_BUCKET_NAME is not defined');

  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const response = await s3Client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType || 'application/octet-stream',
  };
};

module.exports = { uploadToS3, getS3Object };
