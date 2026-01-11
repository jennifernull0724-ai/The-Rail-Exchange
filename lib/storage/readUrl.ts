import 'server-only';

import '@/lib/env';

declare const process: {
  env: Record<string, string | undefined>;
};

export type SignedReadUrlInput = {
  bucket: string;
  key: string;
  expiresInSeconds?: number;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function getSignedReadUrl({ bucket, key, expiresInSeconds }: SignedReadUrlInput): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('getSignedReadUrl must never execute in the browser.');
  }

  if (process.env.FILE_STORAGE_PROVIDER !== 'aws_s3') {
    throw new Error('Signed read URLs blocked: FILE_STORAGE_PROVIDER is not aws_s3.');
  }

  if (!isNonEmptyString(bucket)) {
    throw new Error('Signed read URL failed: bucket is required.');
  }

  if (!isNonEmptyString(key)) {
    throw new Error('Signed read URL failed: key is required.');
  }

  const region = process.env.FILE_STORAGE_REGION;
  const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.FILE_STORAGE_SECRET_KEY;

  if (!isNonEmptyString(region)) {
    throw new Error('Signed read URLs blocked: FILE_STORAGE_REGION is missing.');
  }

  if (!isNonEmptyString(accessKeyId)) {
    throw new Error('Signed read URLs blocked: FILE_STORAGE_ACCESS_KEY is missing.');
  }

  if (!isNonEmptyString(secretAccessKey)) {
    throw new Error('Signed read URLs blocked: FILE_STORAGE_SECRET_KEY is missing.');
  }

  const ttl = expiresInSeconds ?? 60;
  if (!Number.isFinite(ttl) || ttl <= 0 || ttl > 900) {
    throw new Error('Signed read URL failed: expiresInSeconds must be between 1 and 900.');
  }

  try {
    // @ts-ignore - AWS SDK types/deps must be installed in the app for runtime.
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    // @ts-ignore - AWS SDK types/deps must be installed in the app for runtime.
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: ttl });

    if (!isNonEmptyString(url)) {
      throw new Error('Signed read URL failed: signer returned empty URL.');
    }

    return url;
  } catch (err) {
    throw new Error(`Signed read URL failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
