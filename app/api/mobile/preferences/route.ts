import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Busca preferências
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        wallpaperUrl: true,
        myBubbleColor: true,
        otherBubbleColor: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar preferências" }, { status: 500 });
  }
}

// POST: Salva preferências (com suporte a upload)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const contentType = request.headers.get("content-type") || "";

    const updateData: any = {};
    let removeWallpaper = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const myBubbleColor = formData.get("myBubbleColor") as string | null;
      const otherBubbleColor = formData.get("otherBubbleColor") as string | null;
      removeWallpaper = formData.get("removeWallpaper") === "true";

      if (myBubbleColor) updateData.myBubbleColor = myBubbleColor;
      if (otherBubbleColor) updateData.otherBubbleColor = otherBubbleColor;

      const wallpaperFile = formData.get("wallpaper") as File | null;
      if (wallpaperFile) {
        const blob = await utapi.uploadFiles(
          new File([await wallpaperFile.arrayBuffer()], `wallpaper-${Date.now()}-${wallpaperFile.name}`, { type: wallpaperFile.type })
        );
        if (!blob.error && blob.data) updateData.wallpaperUrl = blob.data.url;
      }
      if (removeWallpaper) updateData.wallpaperUrl = null;
    } else {
      const payload = await request.json();
      if (payload.myBubbleColor) updateData.myBubbleColor = payload.myBubbleColor;
      if (payload.otherBubbleColor) updateData.otherBubbleColor = payload.otherBubbleColor;

      if (payload.removeWallpaper) {
        updateData.wallpaperUrl = null;
      } else if (payload.wallpaperUrl) {
        updateData.wallpaperUrl = payload.wallpaperUrl;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        wallpaperUrl: true,
        myBubbleColor: true,
        otherBubbleColor: true
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}