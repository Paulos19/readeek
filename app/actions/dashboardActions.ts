"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  const userId = session.user.id;

  try {
    const [
      user,
      totalBooks,
      booksRead,
      totalHighlights,
      followersCount,
      followingCount,
    ] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      }),
      prisma.book.count({ where: { userId } }),
      prisma.book.count({ where: { userId, progress: 100 } }),
      prisma.highlight.count({ where: { book: { userId } } }),
      prisma.follows.count({ where: { followingId: userId } }),
      prisma.follows.count({ where: { followerId: userId } }),
    ]);

    return {
      credits: user?.credits ?? 0,
      totalBooks,
      booksRead,
      totalHighlights,
      followersCount,
      followingCount,
    };
  } catch (error) {
    console.error("Falha ao buscar estatísticas do dashboard:", error);
    // Retorna valores padrão em caso de erro
    return {
      credits: 0,
      totalBooks: 0,
      booksRead: 0,
      totalHighlights: 0,
      followersCount: 0,
      followingCount: 0,
    };
  }
}