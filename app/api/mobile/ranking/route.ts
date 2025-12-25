import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Garante que não faça cache estático

export async function GET(request: Request) {
  try {
    // Busca usuários e conta suas interações
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        // Trazemos as contagens para calcular o score
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true, // Reações que o usuário FEZ
          },
        },
      },
    });

    // Aplica a fórmula da versão Web
    const scoredUsers = users.map((user) => {
      const score =
        (user._count.posts * 5) +
        (user._count.comments * 2) +
        (user._count.reactions * 1);

      // Removemos o objeto _count para limpar o retorno
      const { _count, ...userData } = user;
      
      return {
        ...userData,
        score, // Novo campo calculado
      };
    });

    // Ordena por pontuação (maior para menor) e pega os top 50
    const sortedUsers = scoredUsers
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}