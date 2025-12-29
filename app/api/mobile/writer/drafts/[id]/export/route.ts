import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import JSZip from "jszip";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const COST_EXPORT_BOOK = 25; // Custo em créditos

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
      
      // Verifica se é atualização ou criação para cobrar
      // (Opcional: Você pode cobrar menos para atualizar, aqui cobraremos sempre o export)
      if (!user || user.credits < COST_EXPORT_BOOK) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const draft = await tx.bookDraft.findUnique({
        where: { id: draftId },
        include: { 
          chapters: { orderBy: { order: 'asc' } },
          user: true,
          characters: true, // Incluindo para futuro glossário
          lore: true
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
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
      </container>`);

    const oebps = zip.folder("OEBPS");

    // --- LÓGICA DO ÍNDICE AUTOMÁTICO (TOC HTML) ---
    // Cria uma página HTML real para o índice que ficará no começo do livro
    let tocHtmlContent = `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head><title>Índice</title></head>
    <body>
      <h1>Índice</h1>
      <ul>`;

    let manifestItems = "";
    let spineRefs = "";
    let tocNavPoints = "";

    // Adiciona a página de índice ao manifesto primeiro
    const tocFileName = "toc.html";
    manifestItems += `<item id="toc_page" href="${tocFileName}" media-type="application/xhtml+xml"/>\n`;
    spineRefs += `<itemref idref="toc_page"/>\n`;

    // Loop dos Capítulos
    draft.chapters.forEach((chapter, index) => {
      const filename = `chapter_${index + 1}.html`;
      const chapterId = `chap${index + 1}`;
      
      // Gera o link no HTML do índice
      tocHtmlContent += `<li><a href="${filename}">${chapter.title}</a></li>`;

      // Conteúdo HTML do Capítulo
      const htmlContent = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head><title>${chapter.title}</title></head>
        <body>
          <h2>${chapter.title}</h2>
          ${chapter.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
        </body>
        </html>`;

      oebps?.file(filename, htmlContent);

      // Metadados
      manifestItems += `<item id="${chapterId}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spineRefs += `<itemref idref="${chapterId}"/>\n`;
      tocNavPoints += `
        <navPoint id="nav${index + 1}" playOrder="${index + 1}">
          <navLabel><text>${chapter.title}</text></navLabel>
          <content src="${filename}"/>
        </navPoint>`;
    });

    tocHtmlContent += `</ul></body></html>`;
    oebps?.file(tocFileName, tocHtmlContent);

    // Content.opf
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

    // TOC.ncx (Navegação Lógica)
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
      <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head><meta name="dtb:uid" content="urn:uuid:${draft.id}"/></head>
        <docTitle><text>${draft.title}</text></docTitle>
        <navMap>${tocNavPoints}</navMap>
      </ncx>`;

    oebps?.file("toc.ncx", tocNcx);

    // 3. Upload
    const epubContent = await zip.generateAsync({ type: "nodebuffer" });
    const fileKey = `${draft.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${Date.now()}.epub`;
    
    const blob = await put(`books/${fileKey}`, epubContent, {
      access: 'public',
      contentType: 'application/epub+zip'
    });

    // 4. LÓGICA DE SUBSTITUIÇÃO (UPDATE OR CREATE)
    const resultBook = await prisma.$transaction(async (tx) => {
      // Deduzir Créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST_EXPORT_BOOK } }
      });

      // Tenta encontrar um livro JÁ PUBLICADO por este usuário com este TÍTULO
      // (Idealmente teríamos um 'publishedBookId' no Draft, mas usaremos título por enquanto)
      const existingBook = await tx.book.findFirst({
        where: {
          userId: userId,
          title: draft.title
        }
      });

      if (existingBook) {
        // ATUALIZAÇÃO (Replace)
        console.log(`Atualizando livro existente: ${existingBook.id}`);
        return await tx.book.update({
          where: { id: existingBook.id },
          data: {
            filePath: blob.url,
            updatedAt: new Date(), // Força o app a ver que mudou
            description: draft.synopsis,
            coverUrl: draft.coverUrl
          }
        });
      } else {
        // CRIAÇÃO (Novo)
        console.log(`Criando novo livro: ${draft.title}`);
        return await tx.book.create({
          data: {
            title: draft.title,
            author: draft.user.name || "Autor Desconhecido",
            description: draft.synopsis,
            filePath: blob.url,
            coverUrl: draft.coverUrl,
            userId: userId,
            progress: 0
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      bookId: resultBook.id, 
      downloadUrl: blob.url,
      action: "updated" // flag para o front saber
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    if (error.message === "INSUFFICIENT_FUNDS") return NextResponse.json({ error: "Saldo insuficiente (25 CR)" }, { status: 402 });
    return NextResponse.json({ error: "Erro ao exportar" }, { status: 500 });
  }
}