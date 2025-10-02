// app/actions/communityActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

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

    const usersWithActivity = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            posts: { where: { createdAt: { gte: sevenDaysAgo } } },
            reactions: { where: { post: { createdAt: { gte: sevenDaysAgo } } } },
            comments: { where: { createdAt: { gte: sevenDaysAgo } } },
          },
        },
      },
    });

    const scoredUsers = usersWithActivity.map(user => {
      const score = 
        (user._count.posts * 5) +
        (user._count.reactions * 1) +
        (user._count.comments * 2);
      return { ...user, score };
    });

    const topReaders = scoredUsers
      .filter(user => user.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return topReaders;

  } catch (error) {
    console.error("Falha ao obter os leitores da semana:", error);
    return [];
  }
}

export async function getSuggestedUsers() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    // Se não estiver logado, retorna os 5 utilizadores mais ativos
    return prisma.user.findMany({
      orderBy: { followers: { _count: 'desc' } },
      take: 5,
    });
  }

  // Encontra IDs dos utilizadores que o utilizador atual já segue
  const followingIds = (await prisma.follows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  })).map(f => f.followingId);

  // Busca utilizadores que não são o próprio utilizador e que ele ainda não segue
  const suggestedUsers = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        { id: { notIn: followingIds } },
      ],
    },
    orderBy: {
      followers: { _count: 'desc' }, // Sugere os mais populares primeiro
    },
    take: 5,
  });

  return suggestedUsers;
}
