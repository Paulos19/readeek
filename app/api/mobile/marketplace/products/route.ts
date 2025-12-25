import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Verificar se o usuário tem loja
    const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) return NextResponse.json({ error: "Você precisa ter uma loja" }, { status: 403 });

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const currency = formData.get("currency") as 'BRL' | 'CREDITS';
    const address = formData.get("address") as string;
    const stock = parseInt(formData.get("stock") as string || "1");
    const file = formData.get("image") as File;

    if (!title || !price || !address) {
        return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // Criar Produto
    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        title,
        description,
        price,
        currency: currency || 'BRL',
        stock,
        address,
        // Imagens serão adicionadas abaixo
      },
    });

    // Upload da Imagem (Principal)
    if (file) {
      const blob = await put(`products/${product.id}-${file.name}`, file, {
        access: 'public',
      });
      
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: blob.url,
        },
      });
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}