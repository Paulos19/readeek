import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q"); // Para filtro de busca futuro

    // 1. Loja de Créditos (Produtos vendidos pelo Admin em CREDITS)
    // Assumindo que o Admin tem uma Shop ou filtramos por currency
    const creditProducts = await prisma.product.findMany({
      where: {
        currency: 'CREDITS',
        stock: { gt: 0 },
        isSold: false,
        title: query ? { contains: query, mode: 'insensitive' } : undefined
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { images: true }
    });

    // 2. Produtos Recentes da Comunidade (BRL ou TRADE)
    const recentProducts = await prisma.product.findMany({
      where: {
        currency: { not: 'CREDITS' },
        stock: { gt: 0 },
        isSold: false,
        title: query ? { contains: query, mode: 'insensitive' } : undefined
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { 
        images: true,
        shop: {
            select: { name: true, imageUrl: true }
        }
      }
    });

    // 3. Lojas em Destaque (Aleatório ou por volume)
    const featuredShops = await prisma.shop.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }, // Melhorar lógica depois
      include: { owner: { select: { name: true, image: true } } }
    });

    return NextResponse.json({
      creditShop: creditProducts,
      recentDrops: recentProducts,
      shops: featuredShops
    });

  } catch (error) {
    console.error("Erro no Marketplace Feed:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}