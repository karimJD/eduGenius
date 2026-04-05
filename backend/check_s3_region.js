const { S3Client, GetBucketLocationCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const run = async () => {
  const client = new S3Client({
    region: "us-east-1", // Use us-east-1 to query bucket location generally
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new GetBucketLocationCommand({ Bucket: process.env.S3_BUCKET_NAME });
    const response = await client.send(command);
    console.log("Bucket LocationConstraint:", response.LocationConstraint || "us-east-1 (None)");
  } catch (err) {
    console.error("Error fetching bucket location:", err);
  }
};

run();
