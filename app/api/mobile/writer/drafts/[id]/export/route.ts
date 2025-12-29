import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import JSZip from "jszip";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const COST_EXPORT_BOOK = 25;

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ status: 401 });
  }

  try {
    const draftId = params.id;

    // 1. Transaction: Verifica Saldo + Busca Dados
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.credits < COST_EXPORT_BOOK) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const draft = await tx.bookDraft.findUnique({
        where: { id: draftId },
        include: { 
          chapters: { orderBy: { order: 'asc' } },
          user: true 
        }
      });

      if (!draft) throw new Error("NOT_FOUND");
      if (draft.userId !== userId) throw new Error("FORBIDDEN");
      if (draft.chapters.length === 0) throw new Error("EMPTY_BOOK");

      return { user, draft };
    });

    const { draft } = result;

    // 2. Geração do EPUB (Estrutura ZIP)
    const zip = new JSZip();
    
    // Mimetype (obrigatório ser o primeiro e sem compressão)
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    // Container XML
    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
          <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`);

    const oebps = zip.folder("OEBPS");

    // Gerar Capítulos HTML e Manifesto
    let manifestItems = "";
    let spineRefs = "";
    let tocNavPoints = "";

    draft.chapters.forEach((chapter, index) => {
      const filename = `chapter_${index + 1}.html`;
      const chapterId = `chap${index + 1}`;
      
      // Conteúdo HTML Simples
      const htmlContent = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head><title>${chapter.title}</title></head>
        <body>
          <h1>${chapter.title}</h1>
          ${chapter.content.split('\n').map(p => `<p>${p}</p>`).join('')}
        </body>
        </html>`;

      oebps?.file(filename, htmlContent);

      // Adicionar ao Manifesto
      manifestItems += `<item id="${chapterId}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spineRefs += `<itemref idref="${chapterId}"/>\n`;
      tocNavPoints += `
        <navPoint id="nav${index + 1}" playOrder="${index + 1}">
          <navLabel><text>${chapter.title}</text></navLabel>
          <content src="${filename}"/>
        </navPoint>`;
    });

    // Content.opf (Metadados)
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
        <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>${draft.title}</dc:title>
          <dc:creator>${draft.user.name || "Autor Readeek"}</dc:creator>
          <dc:language>pt</dc:language>
          <dc:identifier id="BookId">urn:uuid:${draft.id}</dc:identifier>
        </metadata>
        <manifest>
          <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
          ${manifestItems}
        </manifest>
        <spine toc="ncx">
          ${spineRefs}
        </spine>
      </package>`;

    oebps?.file("content.opf", contentOpf);

    // TOC.ncx (Índice)
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
      <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head>
          <meta name="dtb:uid" content="urn:uuid:${draft.id}"/>
        </head>
        <docTitle><text>${draft.title}</text></docTitle>
        <navMap>
          ${tocNavPoints}
        </navMap>
      </ncx>`;

    oebps?.file("toc.ncx", tocNcx);

    // 3. Gerar Binário e Upload para Vercel Blob
    const epubContent = await zip.generateAsync({ type: "nodebuffer" });
    const fileName = `${draft.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
    
    // Nota: Em produção real, você usaria 'access: public' e configuraria o token no .env
    const blob = await put(`books/${fileName}`, epubContent, {
      access: 'public',
      contentType: 'application/epub+zip'
    });

    // 4. Salvar Livro Final na Tabela 'Book' e Descontar Créditos
    const newBook = await prisma.$transaction(async (tx) => {
      // Deduzir Créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST_EXPORT_BOOK } }
      });

      // Criar Livro na Biblioteca
      return await tx.book.create({
        data: {
          title: draft.title,
          author: draft.user.name || "Autor Desconhecido",
          description: draft.synopsis,
          filePath: blob.url,
          coverUrl: draft.coverUrl, // Se tiver capa
          userId: userId,
          progress: 0
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      bookId: newBook.id, 
      downloadUrl: blob.url 
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    if (error.message === "INSUFFICIENT_FUNDS") return NextResponse.json({ error: "Saldo insuficiente (25 CR)" }, { status: 402 });
    if (error.message === "EMPTY_BOOK") return NextResponse.json({ error: "O livro precisa ter pelo menos um capítulo." }, { status: 400 });
    return NextResponse.json({ error: "Erro ao exportar livro" }, { status: 500 });
  }
}