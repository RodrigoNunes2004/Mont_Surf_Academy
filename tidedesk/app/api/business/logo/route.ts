import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("logo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing logo file" }, { status: 400 });
  }

  const normalizedType = file.type.toLowerCase().replace(/\/x-/, "/");
  if (
    !ALLOWED_TYPES.includes(normalizedType) &&
    !file.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 4MB." },
      { status: 400 }
    );
  }

  const ext =
    normalizedType === "image/webp"
      ? "webp"
      : normalizedType === "image/png"
        ? "png"
        : "jpg";
  const pathname = `business-logos/${businessId}.${ext}`;

  let logoUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(pathname, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      logoUrl = blob.url;
    } catch (err) {
      console.error("Business logo upload error:", err);
      return NextResponse.json(
        { error: "Failed to save logo" },
        { status: 500 }
      );
    }
  } else {
    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            "Logo storage is not configured. Add BLOB_READ_WRITE_TOKEN in your Vercel project Storage settings.",
        },
        { status: 503 }
      );
    }

    const logosDir = path.join(process.cwd(), "public", "business-logos");
    try {
      await mkdir(logosDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(logosDir, `${businessId}.${ext}`), buffer);
      logoUrl = `/business-logos/${businessId}.${ext}`;
    } catch (err) {
      console.error("Business logo save error:", err);
      return NextResponse.json(
        { error: "Failed to save logo" },
        { status: 500 }
      );
    }
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { logoUrl },
  });

  return NextResponse.json({ data: { logoUrl } });
}
