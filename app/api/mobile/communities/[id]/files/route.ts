import { utapi } from "@/lib/uploadthing-server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticação JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let userId = "";

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId;
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // 2. Verificação de Permissões (OWNER ou HONORARY_MEMBER)
  const membership = await prisma.communityMember.findFirst({
    where: { communityId: params.id, userId: userId }
  });

  if (!membership) {
    return NextResponse.json({ error: "Você não é membro desta comunidade." }, { status: 403 });
  }

  // REGRA DE NEGÓCIO: Apenas Dono e Membros Honorários podem postar materiais
  const canUpload = membership.role === 'OWNER' || membership.role === 'HONORARY_MEMBER';

  if (!canUpload) {
    return NextResponse.json({
      error: "Permissão negada. Apenas o Dono e Membros Honorários podem adicionar materiais."
    }, { status: 403 });
  }

  // 3. Processamento do Upload
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileUrl = null;
    let fileName = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      fileName = formData.get("fileName") as string || (file ? file.name : "document");

      if (file) {
        const blob = await utapi.uploadFiles(
          new File([await file.arrayBuffer()], `community-file-${Date.now()}-${file.name}`, { type: file.type })
        );
        if (!blob.error && blob.data) fileUrl = blob.data.url;
      }
    } else {
      const payload = await req.json();
      fileUrl = payload.fileUrl;
      fileName = payload.fileName;
    }

    if (!fileUrl || !fileName) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

    const dbFile = await prisma.communityFile.create({
      data: {
        title: fileName,
        fileUrl: fileUrl,
        fileType: fileName.toLowerCase().includes('.pdf') ? 'PDF' : 'EPUB',
        communityId: params.id,
        uploaderId: userId
      }
    });

    return NextResponse.json(dbFile);
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Falha ao processar upload" }, { status: 500 });
  }
}