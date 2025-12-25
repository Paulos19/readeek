import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // 1. Busca o Produto Principal
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        shop: {
          include: {
            owner: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // 2. Produtos Sugeridos (Exclui o atual, pega 4 recentes)
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        stock: { gt: 0 },
        isSold: false,
        // Opcional: Filtrar pela mesma moeda
        currency: product.currency,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { images: true }
    });

    // 3. Sugestão de Livros da Comunidade (Para manter o engajamento de leitura)
    const communityBooks = await prisma.book.findMany({
      where: {
        sharable: true, // Apenas livros públicos
      },
      take: 4,
      orderBy: { createdAt: 'desc' }, // Ou randômico se preferir
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        downloadsCount: true,
        description: true,
        // Mock de dados necessários para o frontend não quebrar
        userId: true, 
        progress: true 
      }
    });

    return NextResponse.json({
      product,
      relatedProducts,
      communityBooks
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}