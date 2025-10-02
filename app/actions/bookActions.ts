"use server";

import { put } from "@vercel/blob"; // 1. Importe o 'put' do Vercel Blob
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
    // 2. Substitua a lógica de 'writeFile' pela chamada 'put'
    const blob = await put(filename, file, {
      access: 'public', // O ficheiro precisa de ser público para ser lido pelo EpubViewer
    });

    // 3. Guarde o URL retornado pelo Vercel Blob na base de dados
    await prisma.book.create({
      data: {
        title: file.name.replace(/\.epub$/i, ''),
        filePath: blob.url, // Usamos o URL do blob
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
        sharable: true // Apenas livros que os donos marcaram como partilháveis
      },
      orderBy: { 
        createdAt: 'desc' // Ordena pelos mais recentes
      },
      take: 10, // Limita a 10 livros
      include: {
        user: { // Inclui informações básicas do dono do livro
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