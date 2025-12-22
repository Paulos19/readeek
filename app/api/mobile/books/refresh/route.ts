import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEpub } from "@/lib/epubParser"; // Certifique-se de que este arquivo existe (criado no passo anterior)
import { put } from "@vercel/blob";
import jwt from "jsonwebtoken";

// Segredo JWT (Mesmo usado no resto da API Mobile)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request) {
  try {
    // 1. Autenticação (Verificar Token)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Receber ID do livro
    const body = await req.json();
    const { bookId } = body;

    if (!bookId) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

    // 3. Buscar o livro
    const book = await prisma.book.findUnique({
      where: { id: bookId, userId }, // Garante que o livro pertence ao usuário
    });

    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Se já tem capa e autor definido, não faz nada
    if (book.coverUrl && book.author !== "Autor desconhecido") {
        return NextResponse.json({ success: true, updated: false, message: "Metadata already up to date" });
    }

    // 4. Baixar o arquivo e Reprocessar (Lógica central)
    const response = await fetch(book.filePath);
    if (!response.ok) throw new Error("Failed to fetch book file");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await parseEpub(buffer);

    // 5. Upload da nova capa (se encontrada)
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

    // 6. Atualizar Banco de Dados
    const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: {
            title: metadata.title !== "Sem Título" ? metadata.title : book.title,
            author: metadata.author !== "Autor Desconhecido" ? metadata.author : book.author,
            description: metadata.description || book.description,
            coverUrl: newCoverUrl,
        }
    });

    return NextResponse.json({ 
        success: true, 
        updated: true, 
        book: {
            title: updatedBook.title,
            author: updatedBook.author,
            coverUrl: updatedBook.coverUrl
        }
    });

  } catch (error) {
    console.error("[API Mobile] Metadata Refresh Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}