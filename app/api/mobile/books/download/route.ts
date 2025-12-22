import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id; // ID do usuário logado

    const { bookId } = await request.json();

    if (!bookId) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

    // 1. Busca o livro original
    const originalBook = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!originalBook) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // 2. Incrementa contador no livro original (Estatística para o dono/admin)
    await prisma.book.update({
        where: { id: bookId },
        data: { downloadsCount: { increment: 1 } }
    });

    // 3. Lógica de "Adicionar à Biblioteca"
    // Se o livro já é do usuário, não clonamos, apenas retornamos o ID original.
    if (originalBook.userId === userId) {
        return NextResponse.json({ 
            success: true, 
            newBookId: originalBook.id,
            action: 'redownload'
        });
    }

    // Se o livro é de outro, criamos uma CÓPIA no banco para o usuário atual.
    // Isso permite que ele tenha seu próprio progresso de leitura (0%) sem afetar o original.
    // Verificamos antes se ele já não tem essa cópia para evitar duplicatas.
    const existingCopy = await prisma.book.findFirst({
        where: {
            userId: userId,
            filePath: originalBook.filePath, // Mesmo arquivo
            title: originalBook.title
        }
    });

    if (existingCopy) {
        return NextResponse.json({ 
            success: true, 
            newBookId: existingCopy.id,
            action: 'exists'
        });
    }

    const newBook = await prisma.book.create({
        data: {
            title: originalBook.title,
            author: originalBook.author,
            coverUrl: originalBook.coverUrl,
            filePath: originalBook.filePath, // Aponta para o mesmo arquivo na nuvem
            description: originalBook.description,
            progress: 0,
            userId: userId, // << AGORA O LIVRO É "DELE"
            sharable: false, 
            downloadsCount: 0
        }
    });

    return NextResponse.json({ 
        success: true, 
        newBookId: newBook.id, // Retornamos o NOVO ID para salvar o arquivo localmente com este nome
        action: 'cloned'
    });

  } catch (error) {
    console.error("Erro ao processar download:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}