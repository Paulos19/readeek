"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
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
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  
  // IMPORTANTE: Esta abordagem salva o arquivo localmente.
  // Para produção (ex: Vercel), substitua esta lógica por um serviço de armazenamento 
  // como Vercel Blob, AWS S3 ou Cloudflare R2.
  const uploadsDir = path.join(process.cwd(), "public/uploads");
  const filePath = path.join(uploadsDir, filename);

  try {
    // Garante que o diretório de uploads exista antes de tentar escrever o arquivo
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filePath, buffer);

    // TODO: Em um cenário avançado, você usaria uma biblioteca como 'epub-parser'
    // aqui no servidor para extrair o título e autor verdadeiros do arquivo EPUB.
    
    await prisma.book.create({
      data: {
        title: file.name.replace(/\.epub$/i, ''), // Remove a extensão .epub do título
        filePath: `/uploads/${filename}`, // Caminho relativo para acesso público
        userId: session.user.id,
        author: 'Autor desconhecido' // Placeholder
      },
    });

    // Invalida o cache da rota do dashboard para que a lista de livros seja atualizada
    revalidatePath("/(app)/dashboard"); 
    return { success: "Livro enviado com sucesso!" };

  } catch (error) {
    console.error("Falha no upload do livro:", error);
    return { error: "Ocorreu um erro no servidor ao tentar salvar o livro." };
  }
}