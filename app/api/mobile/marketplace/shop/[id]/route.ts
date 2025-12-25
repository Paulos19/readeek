import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: {
          select: { id: true, name: true, image: true, role: true }
        },
        products: {
          where: { isSold: false, stock: { gt: 0 } },
          orderBy: { createdAt: 'desc' },
          include: { images: true }
        }
      }
    });

    if (!shop) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    return NextResponse.json(shop);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}