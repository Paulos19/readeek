"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    };
  }
}

export async function getDashboardBooks() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const allBooks = await prisma.book.findMany({
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const myBooks = userId ? allBooks.filter(b => b.userId === userId) : [];
    const featuredBooks = allBooks.filter(b => b.user.role === 'ADMIN');
    const communityBooks = allBooks.filter(b => b.user.role !== 'ADMIN' && b.userId !== userId);
    
    const rankingBooks = [...allBooks].sort((a, b) => b.downloadsCount - a.downloadsCount).slice(0, 10);

    return {
      myBooks,
      featuredBooks,
      communityBooks,
      rankingBooks,
    };
  } catch (error) {
    console.error("Erro ao buscar livros pro dashboard", error);
    return {
      myBooks: [],
      featuredBooks: [],
      communityBooks: [],
      rankingBooks: [],
    };
  }
}