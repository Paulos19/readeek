"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getGames() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const games = await prisma.game.findMany({
      include: {
        owner: {
          select: { id: true, name: true, image: true, role: true }
        },
        purchases: userId ? {
          where: { userId }
        } : false
      },
      orderBy: { plays: 'desc' }
    });

    return games.map(game => ({
      ...game,
      isPurchased: game.ownerId === userId || (game.purchases && game.purchases.length > 0)
    }));
  } catch (error) {
    console.error("Erro ao buscar jogos:", error);
    return [];
  }
}

export async function getGameById(id: string) {
  try {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } }
      }
    });
  } catch (error) {
    console.error("Erro ao buscar jogo:", error);
    return null;
  }
}
