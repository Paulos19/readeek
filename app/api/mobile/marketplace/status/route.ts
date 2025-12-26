import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Busca apenas a data de criação do produto mais recente
    const lastProduct = await prisma.product.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    return NextResponse.json({
      latestProductAt: lastProduct?.createdAt || null
    });
  } catch (error) {
    return NextResponse.json({ latestProductAt: null }, { status: 500 });
  }
}