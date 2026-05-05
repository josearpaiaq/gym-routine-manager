import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const mimeMap: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function uploadImageToR2(imageFile: File, normalizedName: string): Promise<string> {
  const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpeg";
  const key = `machines/${normalizedName}.${ext}`;
  const buffer = Buffer.from(await imageFile.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeMap[ext] ?? imageFile.type ?? "image/jpeg",
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
