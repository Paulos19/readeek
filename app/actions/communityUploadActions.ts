"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Importações problemáticas agora isoladas aqui
import { writeFile } from "fs/promises";
import path from "path";
import * as JSZip from "jszip";
import { DOMParser } from "xmldom";
import { pdf } from "pdf-parse";

export async function uploadCommunityFile(communityId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const member = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId } },
  });

  if (member?.role !== "OWNER" && member?.role !== "HONORARY_MEMBER") {
    return { error: "Apenas o dono e membros honorários podem enviar ficheiros." };
  }
  
  const file = formData.get("file") as File;
  if (!file) return { error: "Nenhum ficheiro enviado" };
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "community");
  try {
    await require('fs/promises').mkdir(uploadDir, { recursive: true });
  } catch (e: any) { if (e.code !== 'EEXIST') throw e; }
  
  const filePath = path.join(uploadDir, filename);

  try {
    await writeFile(filePath, buffer);
    let title = file.name;
    let author = "Desconhecido";

    if (file.type === "application/epub+zip") {
        const zip = await JSZip.loadAsync(buffer);
        const containerFile = zip.file("META-INF/container.xml");
        if (containerFile) {
            const containerXml = await containerFile.async("string");
            const parser = new DOMParser();
            const containerDoc = parser.parseFromString(containerXml, "application/xml");
            const opfPath = containerDoc.getElementsByTagName("rootfile")[0]?.getAttribute("full-path");

            if (opfPath) {
                const opfFile = zip.file(opfPath);
                if (opfFile) {
                    const opfXml = await opfFile.async("string");
                    const opfDoc = parser.parseFromString(opfXml, "application/xml");
                    title = opfDoc.getElementsByTagName("dc:title")[0]?.textContent || title;
                    author = opfDoc.getElementsByTagName("dc:creator")[0]?.textContent || author;
                }
            }
        }
    } else if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      title = (data.info as any)?.Title || title;
      author = (data.info as any)?.Author || author;
    }

    await prisma.communityFile.create({
      data: {
        title,
        author,
        fileUrl: `/uploads/community/${filename}`,
        fileType: file.type.split('/')[1].replace('+zip', ''),
        communityId,
        uploaderId: session.user.id,
      },
    });

    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error) {
    console.error("File upload error:", error);
    return { error: "Falha no upload do ficheiro." };
  }
}