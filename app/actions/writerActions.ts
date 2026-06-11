"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getMyDrafts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  const userId = session.user.id;

  try {
    return await prisma.bookDraft.findMany({
      where: { userId },
      include: {
        _count: {
          select: { chapters: true, characters: true, lore: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (error) {
    console.error("Erro ao buscar rascunhos:", error);
    return [];
  }
}

export async function getDraftById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  const userId = session.user.id;

  try {
    return await prisma.bookDraft.findFirst({
      where: { id, userId },
      include: {
        chapters: { orderBy: { order: 'asc' } },
        characters: true,
        lore: true,
      }
    });
  } catch (error) {
    console.error("Erro ao buscar rascunho:", error);
    return null;
  }
}
