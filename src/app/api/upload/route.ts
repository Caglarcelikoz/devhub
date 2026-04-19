import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireSession } from '@/lib/api/require-session'
import { s3, S3_BUCKET } from '@/lib/s3'
import { prisma } from "@/lib/prisma";
import { randomUUID } from 'crypto'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
const FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
]

const IMAGE_MAX_BYTES = 5 * 1024 * 1024  // 5 MB
const FILE_MAX_BYTES  = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  // Query isPro directly from DB — enriched JWT may not reflect latest subscription state
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!user?.isPro) {
    return NextResponse.json(
      { error: "File uploads require a Pro subscription." },
      { status: 403 },
    );
  }

  const { fileName, fileType, fileSize, itemType } = (await req.json()) as {
    fileName: string;
    fileType: string;
    fileSize: number;
    itemType: "file" | "image";
  };

  if (!fileName || !fileType || !fileSize || !itemType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const isImage = itemType === "image";
  const allowedTypes = isImage ? IMAGE_TYPES : FILE_TYPES;
  const maxSize = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES;

  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json(
      { error: `File type ${fileType} is not allowed` },
      { status: 400 },
    );
  }

  if (fileSize > maxSize) {
    const maxMB = maxSize / 1024 / 1024;
    return NextResponse.json(
      { error: `File exceeds maximum size of ${maxMB} MB` },
      { status: 400 },
    );
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${session.user.id}/${itemType}s/${randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  return NextResponse.json({ uploadUrl, key });
}
