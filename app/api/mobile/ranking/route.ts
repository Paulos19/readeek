import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Busca os top 50 usuários com mais créditos
    const users = await prisma.user.findMany({
      orderBy: {
        credits: 'desc',
      },
      take: 50,
      select: {
        id: true,
        name: true,
        image: true,
        credits: true,
        role: true,
        // Opcional: Trazer insígnias principais se quiser mostrar
        displayedInsigniaIds: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}