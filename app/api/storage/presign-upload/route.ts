import 'server-only';
import '@/lib/env';

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const provider = process.env.FILE_STORAGE_PROVIDER;
  if (provider !== 'aws_s3') {
    throw new Error('FILE_STORAGE_PROVIDER must be aws_s3 for presigned upload smoke test.');
  }

  const region = process.env.FILE_STORAGE_REGION;
  const bucket = process.env.FILE_STORAGE_BUCKET;
  const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.FILE_STORAGE_SECRET_KEY;

  let S3Client: any;
  let PutObjectCommand: any;
  let HeadBucketCommand: any;
  let getSignedUrl: any;

  try {
    const s3 = (await import('@aws-sdk/client-s3')) as any;
    S3Client = s3.S3Client;
    PutObjectCommand = s3.PutObjectCommand;
    HeadBucketCommand = s3.HeadBucketCommand;

    const presigner = (await import('@aws-sdk/s3-request-presigner')) as any;
    getSignedUrl = presigner.getSignedUrl;
  } catch (error) {
    throw new Error(`AWS SDK dependencies missing or failed to load: ${String(error)}`);
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    throw new Error(`S3 bucket unreachable or IAM policy invalid for HeadBucket: ${String(error)}`);
  }

  const key = `/__smoke-test__/${randomUUID()}`;
  const expiresIn = 60;

  let url: string;
  try {
    url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    );
  } catch (error) {
    throw new Error(`Failed to sign S3 PUT request: ${String(error)}`);
  }

  return NextResponse.json({ url, expiresIn });
}
