import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
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

    const formData = await request.formData();
    const myBubbleColor = formData.get("myBubbleColor") as string;
    const otherBubbleColor = formData.get("otherBubbleColor") as string;
    const file = formData.get("wallpaper") as File | null;
    const removeWallpaper = formData.get("removeWallpaper") === "true";

    const updateData: any = {};

    if (myBubbleColor) updateData.myBubbleColor = myBubbleColor;
    if (otherBubbleColor) updateData.otherBubbleColor = otherBubbleColor;

    // Lógica de Wallpaper
    if (removeWallpaper) {
      updateData.wallpaperUrl = null;
    } else if (file) {
      const blob = await put(`wallpapers/${userId}-${Date.now()}.jpg`, file, {
        access: 'public',
      });
      updateData.wallpaperUrl = blob.url;
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