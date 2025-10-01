"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// A biblioteca epubjs é para o lado do cliente e causava o crash no servidor.
// A função de extração da capa foi removida para garantir a estabilidade.
// Para implementar esta funcionalidade corretamente, seria necessário usar uma biblioteca compatível com Node.js, como 'epub-parser'.

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
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  
  const uploadsDir = path.join(process.cwd(), "public/uploads");
  const filePath = path.join(uploadsDir, filename);

  try {
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filePath, buffer);

    // A extração da capa foi removida para evitar o erro do servidor.
    // O coverUrl será guardado como nulo.
    await prisma.book.create({
      data: {
        title: file.name.replace(/\.epub$/i, ''),
        filePath: `/uploads/${filename}`,
        userId: session.user.id,
        author: 'Autor desconhecido', // Placeholder
        coverUrl: null, // <<< CORREÇÃO APLICADA AQUI
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