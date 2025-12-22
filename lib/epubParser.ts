// lib/epubParser.ts
import JSZip from "jszip";
import { DOMParser } from "xmldom";

export interface EpubMetadata {
  title: string;
  author: string;
  description: string | null;
  coverBuffer: Buffer | null;
  coverMimeType: string | null;
}

export async function parseEpub(fileBuffer: Buffer): Promise<EpubMetadata> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const parser = new DOMParser();

  // 1. Encontrar o arquivo OPF (o índice do EPUB)
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("EPUB inválido: container.xml não encontrado.");
  
  const containerXml = await containerFile.async("string");
  const containerDoc = parser.parseFromString(containerXml, "application/xml");
  const rootfile = containerDoc.getElementsByTagName("rootfile")[0];
  const opfPath = rootfile?.getAttribute("full-path");

  if (!opfPath) throw new Error("Caminho do OPF não encontrado.");

  // 2. Ler o arquivo OPF
  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new Error("Arquivo OPF não encontrado.");
  
  const opfXml = await opfFile.async("string");
  const opfDoc = parser.parseFromString(opfXml, "application/xml");

  // 3. Extrair Título, Autor e Descrição
  const metadata = opfDoc.getElementsByTagName("metadata")[0] || opfDoc.getElementsByTagName("opf:metadata")[0];
  
  const getText = (tagName: string) => {
    // Tenta encontrar com e sem namespace (ex: dc:title e title)
    const el = metadata?.getElementsByTagName(tagName)[0] || metadata?.getElementsByTagName(`dc:${tagName}`)[0];
    return el?.textContent || null;
  };

  const title = getText("title") || "Sem Título";
  const author = getText("creator") || "Autor Desconhecido";
  const description = getText("description");

  // 4. Localizar a imagem de capa
  let coverHref: string | null = null;
  let coverMimeType: string | null = null;

  // Estratégia A: Buscar por item com ID definido na meta "cover"
  const metaCover = Array.from(metadata?.getElementsByTagName("meta") || []).find(
    (el: any) => el.getAttribute("name") === "cover"
  );

  const manifest = opfDoc.getElementsByTagName("manifest")[0] || opfDoc.getElementsByTagName("opf:manifest")[0];
  
  if (metaCover) {
    const coverId = metaCover.getAttribute("content");
    const item = Array.from(manifest?.getElementsByTagName("item") || []).find(
      (el: any) => el.getAttribute("id") === coverId
    );
    if (item) {
      coverHref = item.getAttribute("href");
      coverMimeType = item.getAttribute("media-type");
    }
  }

  // Estratégia B: Buscar item com propriedade "cover-image" (EPUB 3)
  if (!coverHref) {
    const item = Array.from(manifest?.getElementsByTagName("item") || []).find(
      (el: any) => el.getAttribute("properties")?.includes("cover-image")
    );
    if (item) {
      coverHref = item.getAttribute("href");
      coverMimeType = item.getAttribute("media-type");
    }
  }

  // 5. Extrair o buffer da imagem
  let coverBuffer: Buffer | null = null;
  if (coverHref) {
    // Resolve o caminho relativo da imagem baseado na pasta do OPF
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/"));
    const fullCoverPath = opfDir ? `${opfDir}/${coverHref}` : coverHref;
    
    const imageFile = zip.file(fullCoverPath);
    if (imageFile) {
      coverBuffer = Buffer.from(await imageFile.async("arraybuffer"));
    }
  }

  return { title, author, description, coverBuffer, coverMimeType };
}