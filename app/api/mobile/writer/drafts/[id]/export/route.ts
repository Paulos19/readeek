import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import JSZip from "jszip";
import { JSDOM } from "jsdom";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const COST_EXPORT_BOOK = 25; 

/**
 * Limpa o HTML do editor e prepara para renderização em leitores de eBook
 */
function processHtmlForEpub(content: string) {
  const dom = new JSDOM(content);
  const doc = dom.window.document;

  // 1. Processar Containers de Imagem (Lógica Canva)
  const containers = doc.querySelectorAll('.resize-container');
  containers.forEach((container: any) => {
    const img = container.querySelector('img');
    if (!img) {
      container.remove();
      return;
    }

    // Captura as dimensões definidas pelo usuário no mobile
    const width = container.style.width;
    const height = container.style.height;

    // Limpa elementos de interface (alças, overlays, botões de mover)
    const uiElements = container.querySelectorAll('.handle, .handle-move, .resize-overlay');
    uiElements.forEach((el: any) => el.remove());

    // Converte o container em um bloco centrado compatível com EPUB
    container.setAttribute('style', `
      display: block;
      margin: 1.5em auto;
      width: ${width || '100%'};
      height: ${height || 'auto'};
      text-align: center;
      page-break-inside: avoid;
    `);

    // Ajusta a imagem para preencher o container distorcendo se necessário (object-fit: fill)
    img.setAttribute('style', `
      width: 100%;
      height: 100%;
      display: block;
      object-fit: fill;
      border-radius: 4px;
    `);

    // Atributos de fallback para leitores muito antigos
    if (width) img.setAttribute('width', width.replace('px', ''));
    if (height) img.setAttribute('height', height.replace('px', ''));
    
    container.removeAttribute('contenteditable');
  });

  // 2. Limpar spans de erro ortográfico ou highlight de busca
  const textDecorations = doc.querySelectorAll('.misspelled, .search-highlight');
  textDecorations.forEach((el: any) => {
    const parent = el.parentNode;
    const textNode = doc.createTextNode(el.textContent);
    parent.replaceChild(textNode, el);
  });

  return doc.body.innerHTML;
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
    userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }

  try {
    const draftId = params.id;

    // 1. Transaction: Verifica Saldo + Busca Dados
    const { draft } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.credits < COST_EXPORT_BOOK) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const d = await tx.bookDraft.findUnique({
        where: { id: draftId },
        include: { 
          chapters: { orderBy: { order: 'asc' } },
          user: true
        }
      });

      if (!d) throw new Error("NOT_FOUND");
      if (d.userId !== userId) throw new Error("FORBIDDEN");
      if (d.chapters.length === 0) throw new Error("EMPTY_BOOK");

      return { user, draft: d };
    });

    // 2. Preparação da Estrutura EPUB
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    // Container XML
    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
      </container>`);

    const oebps = zip.folder("OEBPS");

    // Lógica do Índice (TOC HTML e NCX)
    let tocHtmlContent = `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head><title>Índice</title><style>body{font-family:sans-serif;} li{margin:10px 0;}</style></head>
    <body><h1>Índice</h1><ul>`;

    let manifestItems = "";
    let spineRefs = "";
    let tocNavPoints = "";

    // Loop dos Capítulos para processar HTML e gerar arquivos
    draft.chapters.forEach((chapter, index) => {
      const filename = `chapter_${index + 1}.xhtml`;
      const chapterId = `chap${index + 1}`;
      
      tocHtmlContent += `<li><a href="${filename}">${chapter.title}</a></li>`;

      // PROCESSAMENTO DE IMAGENS E CLEANUP
      const processedBody = processHtmlForEpub(chapter.content || "");

      const htmlContent = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title>${chapter.title}</title>
          <style>
            body { font-family: serif; line-height: 1.6; padding: 5%; }
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

    // Adiciona o Índice ao manifesto
    manifestItems += `<item id="toc_page" href="toc.xhtml" media-type="application/xhtml+xml"/>\n`;
    spineRefs = `<itemref idref="toc_page"/>\n` + spineRefs;

    // Content.opf (Metadados do Livro)
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

    // TOC.ncx (Navegação estrutural do dispositivo)
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
      <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head><meta name="dtb:uid" content="urn:uuid:${draft.id}"/></head>
        <docTitle><text>${draft.title}</text></docTitle>
        <navMap>${tocNavPoints}</navMap>
      </ncx>`;

    oebps?.file("toc.ncx", tocNcx);

    // 3. Gerar Binário e Upload para Vercel Blob
    const epubContent = await zip.generateAsync({ type: "nodebuffer" });
    const fileNameSafe = draft.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileKey = `published/${fileNameSafe}_${Date.now()}.epub`;
    
    const blob = await put(fileKey, epubContent, {
      access: 'public',
      contentType: 'application/epub+zip'
    });

    // 4. Salvar no Banco e Cobrar Créditos
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