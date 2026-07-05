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

/**
 * Persist an image that lives at a `data:` URI or a remote URL into S3 and
 * return the stable public URL. Used to capture AI-generated images (whose
 * hosted URLs are temporary) so they survive long-term.
 */
export async function persistImageToS3(
  source: string,
  key: string
): Promise<string> {
  let buffer: Buffer;
  let contentType = "image/png";

  if (source.startsWith("data:")) {
    const match = source.match(/^data:([^;]+);base64,(.*)$/s);
    if (!match) throw new Error("Invalid data URI");
    contentType = match[1] || "image/png";
    buffer = Buffer.from(match[2], "base64");
  } else {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
    contentType = res.headers.get("content-type") || "image/png";
    buffer = Buffer.from(await res.arrayBuffer());
  }

  return uploadToS3(key, buffer, contentType);
}

export { BUCKET, REGION };
