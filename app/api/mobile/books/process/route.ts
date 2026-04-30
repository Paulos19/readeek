import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parseEpub } from "@/lib/epubParser";
import { convertPdfToEpub } from "@/lib/pdfToEpub";
import { utapi } from "@/lib/uploadthing-server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

/**
 * POST /api/mobile/books/process
 * 
 * Endpoint leve que recebe a URL de um arquivo já hospedado no UploadThing,
 * baixa-o para extrair metadados (título, autor, capa), converte PDF→EPUB
 * se necessário, e cria o registro do livro no banco.
 * 
 * Body JSON: { fileUrl: string, fileName: string }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const body = await request.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: "fileUrl e fileName são obrigatórios" }, { status: 400 });
    }

    console.log("[Process] Processando arquivo:", fileName, "| URL:", fileUrl);

    // 1. Baixar o arquivo da URL do UploadThing
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Não foi possível baixar o arquivo do storage" }, { status: 400 });
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    const lowerName = fileName.toLowerCase();

    console.log("[Process] Arquivo baixado:", buffer.length, "bytes");

    // 2. Se for PDF, converter para EPUB e re-upload
    let finalFileUrl = fileUrl;
    const isPdf = lowerName.endsWith('.pdf');

    if (isPdf) {
      try {
        console.log("[Process] Detectado PDF, convertendo para EPUB...");
        buffer = await convertPdfToEpub(buffer, fileName.replace(/\.pdf$/i, ''));
        console.log("[Process] PDF convertido:", buffer.length, "bytes. Fazendo re-upload...");

        // Re-upload do EPUB convertido
        const safeTitle = fileName.replace(/\.pdf$/i, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const epubFilename = `books/converted/${Date.now()}-${safeTitle}.epub`;
        const epubFile = new File([new Uint8Array(buffer)], epubFilename, { type: 'application/epub+zip' });
        const uploadResult = await utapi.uploadFiles(epubFile);

        if (uploadResult.error) {
          console.error("[Process] Re-upload do EPUB falhou:", uploadResult.error);
          return NextResponse.json({ error: "Falha ao salvar o EPUB convertido" }, { status: 500 });
        }

        finalFileUrl = uploadResult.data.url;
        console.log("[Process] EPUB re-uploaded:", finalFileUrl);
      } catch (e: any) {
        console.error("[Process] Conversão PDF falhou:", e.message);
        return NextResponse.json({ error: "Falha ao converter PDF", details: e.message }, { status: 400 });
      }
    }

    // 3. Extrair metadados do EPUB
    let metadata;
    try {
      metadata = await parseEpub(buffer);
    } catch (e) {
      metadata = {
        title: fileName.replace(/\.(epub|pdf)$/i, ''),
        author: "Autor Desconhecido",
        description: null,
        coverBuffer: null,
        coverMimeType: null
      };
    }

    console.log("[Process] Metadados:", metadata.title, "|", metadata.author);

    // 4. Verificar duplicidade
    const existingBook = await prisma.book.findFirst({
      where: {
        userId: userId,
        title: {
          equals: metadata.title,
          mode: 'insensitive'
        }
      }
    });

    if (existingBook) {
      return NextResponse.json({
        error: "Duplicidade detectada",
        message: `Você já possui o livro "${metadata.title}" na sua biblioteca.`
      }, { status: 409 });
    }

    // 5. Upload da capa (se houver)
    let coverUrl = null;
    if (metadata.coverBuffer && metadata.coverMimeType) {
      try {
        const ext = metadata.coverMimeType.split('/')[1] || 'jpg';
        const safeTitle = (metadata.title || 'book').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const coverFilename = `covers/mobile-upload/${Date.now()}-${safeTitle}.${ext}`;
        const coverFile = new File([new Uint8Array(metadata.coverBuffer)], coverFilename, { type: metadata.coverMimeType });
        const coverBlob = await utapi.uploadFiles(coverFile);
        if (!coverBlob.error && coverBlob.data) {
          coverUrl = coverBlob.data.url;
        }
      } catch (e) {
        console.warn("[Process] Falha ao upload da capa, ignorando");
      }
    }

    // 6. Salvar no banco
    const newBook = await prisma.book.create({
      data: {
        title: metadata.title,
        author: metadata.author,
        description: metadata.description,
        filePath: finalFileUrl,
        coverUrl: coverUrl,
        userId: userId,
        progress: 0
      }
    });

    console.log("[Process] Livro criado com sucesso:", newBook.id);
    return NextResponse.json({ success: true, book: newBook });

  } catch (error: any) {
    console.error("[Process] Erro geral:", error);
    return NextResponse.json({
      error: "Erro interno no servidor",
      details: error?.message || "Erro não identificado"
    }, { status: 500 });
  }
}
