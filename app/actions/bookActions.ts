"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function uploadBook(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Não autorizado. Faça login para continuar." };
  }

  const file = formData.get("epubFile") as File | null;
  if (!file || file.size === 0) {
    return { error: "Nenhum arquivo foi selecionado." };
  }
  if (file.type !== 'application/epub+zip') {
    return { error: "Arquivo inválido. Por favor, envie um arquivo no formato .epub." };
  }

  const filename = file.name.replace(/\s/g, '_');

  try {
    const blob = await put(filename, file, {
      access: 'public',
    });

    await prisma.book.create({
      data: {
        title: file.name.replace(/\.epub$/i, ''),
        filePath: blob.url,
        userId: session.user.id,
        author: 'Autor desconhecido',
        coverUrl: null,
      },
    });

    revalidatePath("/(app)/dashboard");
    return { success: "Livro enviado com sucesso!" };

  } catch (error) {
    console.error("Falha no upload do livro:", error);
    return { error: "Ocorreu um erro no servidor ao tentar salvar o livro." };
  }
}

export async function updateBookProgress({ bookId, progress, currentLocation }: { bookId: string, progress: number, currentLocation: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
      return { error: "Não autorizado." };
  }

  try {
      await prisma.book.update({
          where: {
              id: bookId,
              userId: session.user.id,
          },
          data: {
              progress,
              updatedAt: new Date(), // Garante que este livro será o mais recente
              currentLocation,
          },
      });
      revalidatePath("/(app)/dashboard");
      return { success: true };
  } catch (error) {
      console.error("Falha ao atualizar o progresso:", error);
      return { error: "Não foi possível guardar o seu progresso." };
  }
}

export async function getRecentSharableBooks() {
  try {
    return await prisma.book.findMany({
      where: { 
        sharable: true
      },
      orderBy: { 
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Falha ao buscar livros recentes:", error);
    return [];
  }
}

export async function getCurrentlyReadingBook() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  try {
    // Busca o livro do utilizador que foi atualizado mais recentemente e não está concluído
    const book = await prisma.book.findFirst({
      where: {
        userId: session.user.id,
        progress: {
          lt: 100, // lt = less than (menor que 100)
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Se não houver livros em progresso, retorna o mais recente adicionado
    if (!book) {
        return prisma.book.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    return book;
  } catch (error) {
    console.error("Erro ao buscar livro atual:", error);
    return null;
  }
}

// ========= FUNÇÕES ADICIONADAS ABAIXO =========

/**
 * Guarda a localização atual da leitura de um livro.
 */
export async function saveReadingProgress(bookId: string, currentLocation: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Não autorizado." };
  }

  try {
    await prisma.book.update({
      where: {
        id: bookId,
        userId: session.user.id,
      },
      data: {
        currentLocation: currentLocation,
        updatedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao guardar o progresso da leitura:", error);
    return { error: "Não foi possível guardar o seu progresso." };
  }
}

/**
 * Cria um novo destaque (highlight) para um livro.
 */
export async function createHighlight(bookId: string, cfiRange: string, text: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  try {
    const highlight = await prisma.highlight.create({
      data: {
        userId: session.user.id,
        bookId,
        cfiRange,
        text,
        color,
      },
    });
    revalidatePath("/(app)/dashboard/highlights");
    return highlight;
  } catch (error) {
    console.error("Erro ao criar o destaque:", error);
    throw new Error("Não foi possível guardar o destaque.");
  }
}

/**
 * Obtém todos os destaques de um livro para o utilizador atual.
 */
export async function getBookHighlights(bookId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  try {
    const highlights = await prisma.highlight.findMany({
      where: {
        userId: session.user.id,
        bookId: bookId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return highlights;
  } catch (error) {
    console.error("Erro ao buscar os destaques:", error);
    return [];
  }
}
