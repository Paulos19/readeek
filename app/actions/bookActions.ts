"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { parseEpub } from "@/lib/epubParser";

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

  try {
    // 1. Converter File para Buffer para análise
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extrair metadados (Título, Autor, Descrição, Capa)
    let metadata;
    try {
      metadata = await parseEpub(buffer);
    } catch (parseError) {
      console.warn("Falha ao extrair metadados do EPUB:", parseError);
      // Fallback seguro caso o EPUB esteja fora do padrão
      metadata = {
        title: file.name.replace(/\.epub$/i, '').replace(/_/g, ' '),
        author: "Autor desconhecido",
        description: null,
        coverBuffer: null,
        coverMimeType: null
      };
    }

    // 3. Upload do arquivo do Livro (.epub)
    // Usamos um nome limpo baseado no título extraído
    const safeTitle = metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `books/${Date.now()}-${safeTitle}.epub`;
    
    const bookBlob = await put(filename, file, {
      access: 'public',
    });

    // 4. Upload da Capa (apenas se extraída com sucesso)
    let coverUrl = null;
    if (metadata.coverBuffer && metadata.coverMimeType) {
      const ext = metadata.coverMimeType.split('/')[1] || 'jpg';
      const coverFilename = `covers/${Date.now()}-${safeTitle}.${ext}`;
      
      const coverBlob = await put(coverFilename, metadata.coverBuffer, {
        access: 'public',
        contentType: metadata.coverMimeType,
      });
      coverUrl = coverBlob.url;
    }

    // 5. Salvar no Banco de Dados
    await prisma.book.create({
      data: {
        title: metadata.title,
        author: metadata.author,
        description: metadata.description, // Salva a sinopse extraída
        filePath: bookBlob.url,
        coverUrl: coverUrl, // Salva a URL da capa do Blob
        userId: session.user.id,
        progress: 0,
      },
    });

    revalidatePath("/(app)/dashboard");
    return { success: "Livro enviado com sucesso!" };

  } catch (error) {
    console.error("Falha crítica no upload do livro:", error);
    return { error: "Ocorreu um erro no servidor ao processar o livro." };
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
  const books = await prisma.book.findMany({
    where: { sharable: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    // Alterado de 'include' para 'select' no utilizador
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  return books;
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

export async function refreshBookMetadata(bookId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado." };

  try {
    // 1. Buscar o livro atual
    const book = await prisma.book.findUnique({
      where: { id: bookId, userId: session.user.id },
    });

    if (!book) return { error: "Livro não encontrado." };

    // Se o livro já tem capa e não é "Autor desconhecido", não precisamos fazer nada
    if (book.coverUrl && book.author !== "Autor desconhecido") {
        return { success: false, message: "Metadados já estão atualizados." };
    }

    // 2. Baixar o arquivo EPUB do Blob Storage para a memória
    const response = await fetch(book.filePath);
    if (!response.ok) throw new Error("Falha ao baixar o arquivo do livro.");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Extrair novos metadados
    const metadata = await parseEpub(buffer);

    // 4. Se encontrou uma capa nova, fazer upload
    let newCoverUrl = book.coverUrl;
    if (metadata.coverBuffer && metadata.coverMimeType) {
        const safeTitle = metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const ext = metadata.coverMimeType.split('/')[1] || 'jpg';
        const coverFilename = `covers/${Date.now()}-${safeTitle}.${ext}`;
        
        const coverBlob = await put(coverFilename, metadata.coverBuffer, {
            access: 'public',
            contentType: metadata.coverMimeType,
        });
        newCoverUrl = coverBlob.url;
    }

    // 5. Atualizar o Banco de Dados
    await prisma.book.update({
        where: { id: bookId },
        data: {
            title: metadata.title !== "Sem Título" ? metadata.title : book.title,
            author: metadata.author !== "Autor Desconhecido" ? metadata.author : book.author,
            description: metadata.description || book.description,
            coverUrl: newCoverUrl,
        }
    });

    revalidatePath("/(app)/dashboard");
    revalidatePath(`/read/${bookId}`);
    
    return { success: true, message: "Metadados atualizados com sucesso!" };

  } catch (error) {
    console.error("Erro ao atualizar metadados:", error);
    return { error: "Falha na atualização automática." };
  }
}
