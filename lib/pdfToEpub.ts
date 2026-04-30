// lib/pdfToEpub.ts
// Conversor PDF -> EPUB robusto e compatível com Vercel serverless
import JSZip from "jszip";

/**
 * Remove caracteres inválidos para XML 1.0
 * Mantém apenas: tab, newline, carriage return, e caracteres >= 0x20
 */
function sanitizeForXml(str: string): string {
  // Remove caracteres de controle inválidos em XML
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Escapa caracteres especiais XML
 */
function escapeXml(str: string): string {
  return sanitizeForXml(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formata o texto extraído em parágrafos legíveis:
 * - Junta linhas quebradas no meio de frases (soft hyphens)
 * - Preserva quebras de parágrafo reais (linhas em branco)
 * - Remove duplicatas de espaço
 */
function formatTextIntoParagraphs(rawText: string): string[] {
  // Normalizar quebras de linha
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Dividir em blocos separados por linhas em branco (parágrafos reais)
  const blocks = text.split(/\n\s*\n/);

  const paragraphs: string[] = [];

  for (const block of blocks) {
    // Dentro de cada bloco, juntar linhas que são continuação de frase
    const lines = block.split('\n');
    let currentParagraph = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (currentParagraph) {
        // Se a linha anterior termina com hífen, juntar sem espaço
        if (currentParagraph.endsWith('-')) {
          currentParagraph = currentParagraph.slice(0, -1) + trimmed;
        } else {
          currentParagraph += ' ' + trimmed;
        }
      } else {
        currentParagraph = trimmed;
      }
    }

    if (currentParagraph.trim()) {
      // Limpar espaços múltiplos
      const cleaned = currentParagraph.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 0) {
        paragraphs.push(cleaned);
      }
    }
  }

  return paragraphs;
}

export async function convertPdfToEpub(pdfBuffer: Buffer | any, title: string): Promise<any> {
  console.log("[PDF->EPUB] Iniciando conversão para:", title);

  // ===== EXTRAÇÃO DE TEXTO =====
  // pdf-parse funciona perfeitamente para extração de texto no serverless.
  // Os warnings sobre canvas/@napi-rs são apenas sobre RENDERIZAÇÃO de imagens,
  // não afetam a extração de texto.
  let text = "";
  let numPages = 0;

  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(pdfBuffer, {
      // Não precisamos renderizar páginas, apenas extrair texto
      max: 0, // 0 = todas as páginas
    });
    text = data.text || "";
    numPages = data.numpages || 1;
    console.log("[PDF->EPUB] Texto extraído:", text.length, "caracteres,", numPages, "páginas");
  } catch (e: any) {
    console.error("[PDF->EPUB] Falha na extração:", e.message);
    text = `Não foi possível extrair o texto deste PDF. O arquivo "${title}" pode estar protegido ou conter apenas imagens.`;
  }

  if (text.length < 10) {
    text = `Este PDF não possui texto extraível. O arquivo "${title}" pode conter apenas imagens ou estar protegido contra cópia.`;
    console.warn("[PDF->EPUB] Texto insuficiente, usando placeholder");
  }

  // ===== FORMATAÇÃO =====
  const paragraphs = formatTextIntoParagraphs(text);
  const safeTitle = escapeXml(title);
  const uuid = "pdf-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  console.log("[PDF->EPUB] Formatado em", paragraphs.length, "parágrafos");

  // ===== CONSTRUIR EPUB =====
  const zip = new JSZip();

  // mimetype (obrigatório sem compressão pela spec EPUB)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file("META-INF/container.xml",
`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // ===== Dividir conteúdo em capítulos (1 capítulo a cada ~50 parágrafos) =====
  const PARAGRAPHS_PER_CHAPTER = 50;
  const chapters: { id: string; title: string; paragraphs: string[] }[] = [];

  if (paragraphs.length <= PARAGRAPHS_PER_CHAPTER) {
    chapters.push({ id: "chapter1", title: safeTitle, paragraphs });
  } else {
    for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_CHAPTER) {
      const chapterNum = Math.floor(i / PARAGRAPHS_PER_CHAPTER) + 1;
      const slice = paragraphs.slice(i, i + PARAGRAPHS_PER_CHAPTER);
      chapters.push({
        id: `chapter${chapterNum}`,
        title: `Parte ${chapterNum}`,
        paragraphs: slice,
      });
    }
  }

  // ===== OEBPS/content.opf =====
  const manifestItems = chapters
    .map(ch => `    <item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`)
    .join("\n");

  const spineItems = chapters
    .map(ch => `    <itemref idref="${ch.id}"/>`)
    .join("\n");

  zip.file("OEBPS/content.opf",
`<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    <dc:creator>Convertido de PDF</dc:creator>
    <dc:language>pt-BR</dc:language>
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`);

  // ===== OEBPS/toc.ncx =====
  const navPoints = chapters
    .map((ch, i) =>
`    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel>
        <text>${ch.title}</text>
      </navLabel>
      <content src="${ch.id}.xhtml"/>
    </navPoint>`)
    .join("\n");

  zip.file("OEBPS/toc.ncx",
`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
  </head>
  <docTitle>
    <text>${safeTitle}</text>
  </docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`);

  // ===== OEBPS/style.css =====
  zip.file("OEBPS/style.css",
`body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.7;
  margin: 1.2em;
  color: #1a1a1a;
  text-align: justify;
}
p {
  text-indent: 1.5em;
  margin: 0.4em 0;
}
h1 {
  text-align: center;
  margin: 1.5em 0 1em;
  font-size: 1.4em;
  color: #333;
  font-weight: bold;
}
h2 {
  text-align: center;
  margin: 1em 0 0.8em;
  font-size: 1.2em;
  color: #444;
}`);

  // ===== Gerar cada capítulo XHTML =====
  for (const chapter of chapters) {
    const htmlParagraphs = chapter.paragraphs
      .map(p => `    <p>${escapeXml(p)}</p>`)
      .join("\n");

    const heading = chapters.length > 1
      ? `  <h2>${chapter.title}</h2>`
      : `  <h1>${safeTitle}</h1>`;

    zip.file(`OEBPS/${chapter.id}.xhtml`,
`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
${heading}
${htmlParagraphs}
</body>
</html>`);
  }

  // ===== Gerar ZIP =====
  const epubBuffer = await zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  console.log("[PDF->EPUB] EPUB gerado:", epubBuffer.length, "bytes,", chapters.length, "capítulo(s)");
  return epubBuffer;
}
