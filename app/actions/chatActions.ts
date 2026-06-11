"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  const userId = session.user.id;

  try {
    return await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      include: {
        participants: {
          where: { id: { not: userId } },
          select: { id: true, name: true, image: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return [];
  }
}

export async function getConversationById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  const userId = session.user.id;

  try {
    return await prisma.conversation.findFirst({
      where: { 
        id,
        participants: {
          some: { id: userId }
        }
      },
      include: {
        participants: {
          where: { id: { not: userId } },
          select: { id: true, name: true, image: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, image: true } }
          }
        }
      }
    });
  } catch (error) {
    console.error("Erro ao buscar conversa:", error);
    return null;
  }
}
