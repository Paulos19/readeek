// app/actions/communityActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define um tipo para o resultado da nossa query
export type TopReader = Prisma.UserGetPayload<{
    select: {
        id: true;
        name: true;
        image: true;
        _count: {
            select: {
                posts: true;
                reactions: true;
                comments: true;
            }
        }
    }
}> & { score: number };


export async function getWeeklyTopReaders(): Promise<TopReader[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Obtém todos os utilizadores com as contagens de suas interações nos últimos 7 dias
    const usersWithActivity = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            // Conta apenas as interações da última semana
            posts: { where: { createdAt: { gte: sevenDaysAgo } } },
            reactions: { where: { post: { createdAt: { gte: sevenDaysAgo } } } },
            comments: { where: { createdAt: { gte: sevenDaysAgo } } },
          },
        },
      },
    });

    // Calcula uma pontuação para cada utilizador
    const scoredUsers = usersWithActivity.map(user => {
      const score = 
        (user._count.posts * 5) +      // 5 pontos por post
        (user._count.reactions * 1) + // 1 ponto por reação
        (user._count.comments * 2);   // 2 pontos por comentário
      return { ...user, score };
    });

    // Ordena os utilizadores pela pontuação e retorna os 5 melhores
    const topReaders = scoredUsers
      .filter(user => user.score > 0) // Mostra apenas utilizadores que tiveram alguma atividade
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return topReaders;

  } catch (error) {
    console.error("Falha ao obter os leitores da semana:", error);
    return [];
  }
}