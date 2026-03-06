import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("avatar") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing avatar file" }, { status: 400 });
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
      { error: "File too large. Maximum 2MB." },
      { status: 400 }
    );
  }

  const ext =
    normalizedType === "image/webp"
      ? "webp"
      : normalizedType === "image/png"
        ? "png"
        : "jpg";
  const filename = `${session.user.id}.${ext}`;
  const avatarsDir = path.join(process.cwd(), "public", "avatars");

  try {
    await mkdir(avatarsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(avatarsDir, filename), buffer);
  } catch (err) {
    console.error("Avatar save error:", err);
    return NextResponse.json(
      { error: "Failed to save avatar" },
      { status: 500 }
    );
  }

  const avatarUrl = `/avatars/${filename}`;

  await prisma.user.update({
    where: { id: session.user.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- avatarUrl exists in schema; Prisma client types may be stale
    data: { avatarUrl } as any,
  });

  return NextResponse.json({ data: { avatarUrl } });
}
