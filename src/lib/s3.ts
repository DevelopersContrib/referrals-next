import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_BUCKET || "referrals-uploads";
const REGION = process.env.AWS_REGION || "us-east-1";

let _client: S3Client | null = null;

function getClient() {
  if (!_client) {
    _client = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export function s3PublicUrl(key: string) {
  const cdn = process.env.AWS_S3_CDN_URL;
  if (cdn) return `${cdn.replace(/\/+$/, "")}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Upload a buffer to S3 and return the public URL.
 *
 * @param key   - Object key (path within bucket), e.g. "uploads/banners/1_1719900000.png"
 * @param body  - File contents
 * @param contentType - MIME type
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const params: PutObjectCommandInput = {
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  };

  await getClient().send(new PutObjectCommand(params));
  return s3PublicUrl(key);
}

export { BUCKET, REGION };
