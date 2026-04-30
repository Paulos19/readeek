import JSZip from "jszip";
const pdfParse = require("pdf-parse");

export async function convertPdfToEpub(pdfBuffer: Buffer | any, title: string): Promise<any> {
  // 1. Extract text from the PDF
  const data = await pdfParse(pdfBuffer);
  const text = data.text;

  // 2. Initialize JSZip for EPUB structure
  const zip = new JSZip();

  // 3. Create mimetype file
  zip.file("mimetype", "application/epub+zip");

  // 4. Create META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file("META-INF/container.xml", containerXml);

  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 5. Create OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    <dc:language>pt-BR</dc:language>
    <dc:identifier id="BookId">urn:uuid:12345</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;

  // 6. Create OEBPS/toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
  </head>
  <docTitle>
    <text>${safeTitle}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>Conteúdo</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

  // 7. Format text as basic HTML paragraphs
  const htmlContent = text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('\n');

  // 8. Create OEBPS/content.xhtml
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${safeTitle}</title>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  // 9. Add files to OEBPS folder
  const oebps = zip.folder("OEBPS");
  if (oebps) {
    oebps.file("content.opf", contentOpf);
    oebps.file("toc.ncx", tocNcx);
    oebps.file("content.xhtml", contentXhtml);
  }

  // 10. Generate and return the final buffer
  const epubBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return epubBuffer;
}
