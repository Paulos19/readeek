import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parseEpub } from "@/lib/epubParser";
import { utapi } from "@/lib/uploadthing-server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Identificamos quem está fazendo o pedido
    const currentUserId = decoded.userId || decoded.id;

    // AGORA BUSCAMOS TODOS OS LIVROS (Sem filtro de userId)
    // Opcional: Você pode querer filtrar apenas livros 'sharable: true' no futuro
    const books = await prisma.book.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        progress: true,
        filePath: true,
        currentLocation: true,
        downloadsCount: true,
        description: true,

        // Incluímos explicitamente o dono do livro para o perfil
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    });

    const formattedBooks = books.map(book => {
      // LÓGICA DE PROTEÇÃO DE PROGRESSO
      // Se o livro não é meu, eu não devo ver o progresso do dono
      const isMyBook = book.user.id === currentUserId;

      return {
        ...book,
        // Se não for meu, zero o progresso para não confundir o app
        progress: isMyBook ? book.progress : 0,
        currentLocation: isMyBook ? book.currentLocation : null,

        // Flattening para facilitar no mobile
        userId: book.user.id,
        userName: book.user.name,
        userImage: book.user.image,
        userRole: book.user.role
      };
    });

    return NextResponse.json(formattedBooks);
  } catch (error) {
    console.error("Erro API Books:", error);
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // 1. Receber o JSON
    const body = await request.json();
    const { bookUrl } = body;

    if (!bookUrl) {
      return NextResponse.json({ error: "Nenhum URL de livro enviado" }, { status: 400 });
    }

    // 2. Baixar o arquivo EPUB para ler os metadados e a capa
    const fileResponse = await fetch(bookUrl);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Não foi possível baixar o livro para leitura de metadados" }, { status: 400 });
    }
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let metadata;
    try {
      metadata = await parseEpub(buffer);
    } catch (e) {
      // Fallback se falhar o parsing
      metadata = {
        title: "Livro Desconhecido " + Date.now(),
        author: "Autor Desconhecido",
        description: null,
        coverBuffer: null,
        coverMimeType: null
      }
    }

    // 3. BLINDAGEM CONTRA DUPLICIDADE
    // Verifica se este usuário já possui um livro com o mesmo título exato
    const existingBook = await prisma.book.findFirst({
      where: {
        userId: userId,
        title: {
          equals: metadata.title,
          mode: 'insensitive' // Ignora maiúsculas/minúsculas
        }
      }
    });

    if (existingBook) {
      return NextResponse.json({
        error: "Duplicidade detectada",
        message: `Você já possui o livro "${metadata.title}" na sua biblioteca.`
      }, { status: 409 }); // 409 Conflict
    }

    const safeTitle = metadata.title ? metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'book';

    // 5. Upload da Capa (se houver)
    let coverUrl = null;
    if (metadata.coverBuffer && metadata.coverMimeType) {
      const ext = metadata.coverMimeType.split('/')[1] || 'jpg';
      const coverFilename = `covers/mobile-upload/${Date.now()}-${safeTitle}.${ext}`;
      const coverFile = new File([new Uint8Array(metadata.coverBuffer)], coverFilename, { type: metadata.coverMimeType });
      const coverBlob = await utapi.uploadFiles(coverFile);
      if (!coverBlob.error && coverBlob.data) {
        coverUrl = coverBlob.data.url;
      }
    }

    // 6. Salvar no Banco
    const newBook = await prisma.book.create({
      data: {
        title: metadata.title,
        author: metadata.author,
        description: metadata.description,
        filePath: bookUrl,
        coverUrl: coverUrl,
        userId: userId,
        progress: 0
      }
    });

    return NextResponse.json({ success: true, book: newBook });

  } catch (error: any) {
    console.error("Erro upload mobile (Geral):", error);

    // Tratamento extremamente detalhado do erro para não retornar apenas '500'
    const errorMessage = error?.message || error?.toString() || "Erro não identificado";
    const errorStack = error?.stack || "Sem stack trace";

    return NextResponse.json({
      error: "Erro interno no servidor",
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}