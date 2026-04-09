import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Verifica se o usuário tem loja
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
    });

    return NextResponse.json({ shop });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar loja" }, { status: 500 });
  }
}

// POST: Cria uma nova loja
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const contentType = request.headers.get("content-type") || "";
    let name, description, imageUrl;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name") as string;
      description = formData.get("description") as string;

      const imageFile = formData.get("image") as File | null;
      if (imageFile) {
        const blob = await utapi.uploadFiles(
          new File([await imageFile.arrayBuffer()], `shop-${Date.now()}-${imageFile.name}`, { type: imageFile.type })
        );
        if (!blob.error && blob.data) imageUrl = blob.data.url;
      }
    } else {
      const payload = await request.json();
      name = payload.name;
      description = payload.description;
      imageUrl = payload.imageUrl || null;
    }

    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

    const shop = await prisma.shop.create({
      data: {
        ownerId: userId,
        name,
        description,
        imageUrl,
      },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}