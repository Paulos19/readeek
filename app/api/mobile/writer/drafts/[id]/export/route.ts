import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import JSZip from "jszip";
import * as cheerio from "cheerio"; // Troca JSDOM por Cheerio

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const COST_EXPORT_BOOK = 25; 

/**
 * Limpa o HTML do editor usando Cheerio (Mais leve e compatível com Next.js)
 */
function processHtmlForEpub(content: string) {
  // Carrega o HTML (não cria um DOM completo, apenas um parser de string)
  const $ = cheerio.load(content, null, false);

  // 1. Processar Containers de Imagem (Lógica Canva)
  $('.resize-container').each((_, el) => {
    const container = $(el);
    const img = container.find('img');
    
    if (img.length === 0) {
      container.remove();
      return;
    }

    // No Cheerio, pegamos os estilos da string 'style'
    const styleAttr = container.attr('style') || '';
    const widthMatch = styleAttr.match(/width:\s*([^;]+)/);
    const heightMatch = styleAttr.match(/height:\s*([^;]+)/);
    
    const width = widthMatch ? widthMatch[1] : '100%';
    const height = heightMatch ? heightMatch[1] : 'auto';

    // Limpa elementos de interface (alças, overlays, botões de mover)
    container.find('.handle, .handle-move, .resize-overlay').remove();

    // Converte o container em um bloco centrado compatível com EPUB
    container.attr('style', `display: block; margin: 1.5em auto; width: ${width}; height: ${height}; text-align: center; page-break-inside: avoid;`);

    // Ajusta a imagem
    img.attr('style', `width: 100%; height: 100%; display: block; object-fit: fill; border-radius: 4px;`);

    // Fallback de atributos
    if (width.includes('px')) img.attr('width', width.replace('px', '').trim());
    if (height.includes('px')) img.attr('height', height.replace('px', '').trim());
    
    container.removeAttr('contenteditable');
  });

  // 2. Limpar spans de erro ou highlight
  $('.misspelled, .search-highlight').each((_, el) => {
    const $el = $(el);
    $el.replaceWith($el.text());
  });

  // Retorna apenas o conteúdo do body
  return $.html();
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    const token = authHeader.split(" ")[1];
    userId = (jwt.verify(token, JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }

  try {
    const draftId = params.id;

    const { draft } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.credits < COST_EXPORT_BOOK) throw new Error("INSUFFICIENT_FUNDS");

      const d = await tx.bookDraft.findUnique({
        where: { id: draftId },
        include: { chapters: { orderBy: { order: 'asc' } }, user: true }
      });

      if (!d) throw new Error("NOT_FOUND");
      if (d.userId !== userId) throw new Error("FORBIDDEN");
      if (d.chapters.length === 0) throw new Error("EMPTY_BOOK");

      return { user, draft: d };
    });

    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
      </container>`);

    const oebps = zip.folder("OEBPS");

    let tocHtmlContent = `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head><title>Índice</title><style>body{font-family:sans-serif; padding: 20px;} li{margin:10px 0;}</style></head>
    <body><h1>Índice</h1><ul>`;

    let manifestItems = "";
    let spineRefs = "";
    let tocNavPoints = "";

    draft.chapters.forEach((chapter, index) => {
      const filename = `chapter_${index + 1}.xhtml`;
      const chapterId = `chap${index + 1}`;
      
      tocHtmlContent += `<li><a href="${filename}">${chapter.title}</a></li>`;

      // PROCESSAMENTO COM CHEERIO
      const processedBody = processHtmlForEpub(chapter.content || "");

      const htmlContent = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title>${chapter.title}</title>
          <style>
            body { font-family: serif; line-height: 1.6; padding: 5%; color: #1a1a1a; }
            h2 { color: #333; text-align: center; margin-bottom: 2em; }
            p { margin-bottom: 1em; text-align: justify; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h2>${chapter.title}</h2>
          ${processedBody}
        </body>
        </html>`;

      oebps?.file(filename, htmlContent);

      manifestItems += `<item id="${chapterId}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spineRefs += `<itemref idref="${chapterId}"/>\n`;
      tocNavPoints += `
        <navPoint id="nav${index + 1}" playOrder="${index + 1}">
          <navLabel><text>${chapter.title}</text></navLabel>
          <content src="${filename}"/>
        </navPoint>`;
    });

    tocHtmlContent += `</ul></body></html>`;
    oebps?.file("toc.xhtml", tocHtmlContent);

    manifestItems += `<item id="toc_page" href="toc.xhtml" media-type="application/xhtml+xml"/>\n`;
    spineRefs = `<itemref idref="toc_page"/>\n` + spineRefs;

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
        <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>${draft.title}</dc:title>
          <dc:creator>${draft.user.name || "Autor Readeek"}</dc:creator>
          <dc:language>pt-BR</dc:language>
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

    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
      <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head><meta name="dtb:uid" content="urn:uuid:${draft.id}"/></head>
        <docTitle><text>${draft.title}</text></docTitle>
        <navMap>${tocNavPoints}</navMap>
      </ncx>`;

    oebps?.file("toc.ncx", tocNcx);

    const epubContent = await zip.generateAsync({ type: "nodebuffer" });
    const fileNameSafe = draft.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileKey = `published/${fileNameSafe}_${Date.now()}.epub`;
    
    const blob = await put(fileKey, epubContent, {
      access: 'public',
      contentType: 'application/epub+zip'
    });

    const resultBook = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST_EXPORT_BOOK } }
      });

      const existingBook = await tx.book.findFirst({
        where: { userId, title: draft.title }
      });

      if (existingBook) {
        return await tx.book.update({
          where: { id: existingBook.id },
          data: {
            filePath: blob.url,
            updatedAt: new Date(),
            description: draft.synopsis,
            coverUrl: draft.coverUrl
          }
        });
      } else {
        return await tx.book.create({
          data: {
            title: draft.title,
            author: draft.user.name || "Autor Readeek",
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
      action: resultBook.updatedAt > resultBook.createdAt ? "updated" : "created"
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    if (error.message === "INSUFFICIENT_FUNDS") return NextResponse.json({ error: "Saldo insuficiente (25 CR)" }, { status: 402 });
    return NextResponse.json({ error: "Erro interno ao processar exportação" }, { status: 500 });
  }
}