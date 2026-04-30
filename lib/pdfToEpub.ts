// lib/pdfToEpub.ts
// Conversor PDF -> EPUB leve e compatível com serverless (Vercel)
// Usa extração de texto direta sem canvas/pdfjs-dist
import JSZip from "jszip";

/**
 * Extrai texto bruto de um buffer PDF sem dependências nativas.
 * Decodifica streams deflate e extrai operadores de texto do PDF.
 */
function extractTextFromPdf(pdfBuffer: Buffer): string {
  const pdfString = pdfBuffer.toString("binary");
  const textParts: string[] = [];

  // Encontrar todos os streams no PDF
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(pdfString)) !== null) {
    let streamContent = match[1];

    // Tentar decodificar FlateDecode (deflate)
    try {
      const startIdx = match.index + match[0].indexOf(streamContent);
      const rawBytes = pdfBuffer.slice(
        pdfString.indexOf(streamContent, match.index),
        pdfString.indexOf(streamContent, match.index) + streamContent.length
      );

      // Verificar se o stream usa FlateDecode
      const objStart = pdfString.lastIndexOf("obj", match.index);
      const objHeader = pdfString.substring(Math.max(0, objStart - 200), match.index);

      if (objHeader.includes("FlateDecode")) {
        try {
          const zlib = require("zlib");
          const decompressed = zlib.inflateSync(rawBytes);
          streamContent = decompressed.toString("binary");
        } catch {
          // Se falhar a descompressão, tentar com o conteúdo bruto
        }
      }
    } catch {
      // Continuar com o conteúdo bruto
    }

    // Extrair texto dos operadores PDF
    // TJ: array de strings, Tj: string simples, ': nova linha + string
    const tjRegex = /\[([^\]]*)\]\s*TJ|<([^>]*)>\s*Tj|\(([^)]*)\)\s*(?:Tj|'|")/g;
    let textMatch;

    while ((textMatch = tjRegex.exec(streamContent)) !== null) {
      if (textMatch[1]) {
        // TJ array - extrair strings entre parênteses
        const innerRegex = /\(([^)]*)\)/g;
        let inner;
        while ((inner = innerRegex.exec(textMatch[1])) !== null) {
          textParts.push(decodeEscapes(inner[1]));
        }
      } else if (textMatch[3]) {
        // Tj ou ' string
        textParts.push(decodeEscapes(textMatch[3]));
      }
    }

    // Detectar operadores de nova linha (Td, TD, T*, ')
    if (/(?:Td|TD|T\*)\s*$/.test(streamContent)) {
      textParts.push("\n");
    }
  }

  // Limpar e formatar o texto
  let result = textParts.join("");

  // Tentar inserir quebras de linha em posições prováveis
  result = result.replace(/([.!?])\s+([A-ZÀ-Ú])/g, "$1\n$2");

  return result.trim();
}

function decodeEscapes(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\([()])/g, "$1");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function convertPdfToEpub(pdfBuffer: Buffer | any, title: string): Promise<any> {
  console.log("[PDF->EPUB] Iniciando conversão para:", title);

  // 1. Tentar extrair texto do PDF
  let text = "";

  // Estratégia 1: Extração manual (sem dependências)
  try {
    text = extractTextFromPdf(pdfBuffer);
    console.log("[PDF->EPUB] Extração manual: obteve", text.length, "caracteres");
  } catch (e: any) {
    console.warn("[PDF->EPUB] Extração manual falhou:", e.message);
  }

  // Estratégia 2: Fallback com pdf-parse (se a extração manual não deu resultado)
  if (text.length < 50) {
    try {
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const data = await pdfParse(pdfBuffer);
      text = data.text || "";
      console.log("[PDF->EPUB] pdf-parse: obteve", text.length, "caracteres");
    } catch (e: any) {
      console.warn("[PDF->EPUB] pdf-parse também falhou:", e.message);
    }
  }

  // Se ainda não tem texto, criar um placeholder
  if (text.length < 10) {
    text = `Este PDF não possui texto extraível. O arquivo "${title}" pode conter apenas imagens ou estar protegido.`;
    console.warn("[PDF->EPUB] Nenhum texto extraído, usando placeholder");
  }

  // 2. Construir EPUB
  const zip = new JSZip();
  const safeTitle = escapeXml(title);

  // mimetype (sem compressão, conforme especificação EPUB)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file("META-INF/container.xml",
`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // Gerar UUID simples
  const uuid = "pdf-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  // OEBPS/content.opf
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
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);

  // OEBPS/toc.ncx
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
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>${safeTitle}</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`);

  // OEBPS/style.css
  zip.file("OEBPS/style.css",
`body {
  font-family: serif;
  line-height: 1.6;
  margin: 1em;
  color: #222;
}
p {
  text-indent: 1.5em;
  margin: 0.3em 0;
}
h1 {
  text-align: center;
  margin-bottom: 2em;
  font-size: 1.5em;
}`);

  // Formatar texto em parágrafos HTML
  const paragraphs = text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => "    <p>" + escapeXml(line) + "</p>")
    .join("\n");

  // OEBPS/content.xhtml
  zip.file("OEBPS/content.xhtml",
`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${safeTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${safeTitle}</h1>
${paragraphs}
</body>
</html>`);

  // Gerar o buffer do EPUB
  const epubBuffer = await zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  console.log("[PDF->EPUB] EPUB gerado com sucesso:", epubBuffer.length, "bytes");
  return epubBuffer;
}
