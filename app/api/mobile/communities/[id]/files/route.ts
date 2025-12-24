import { put } from "@vercel/blob";
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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

    const blob = await put(`community/${params.id}/${file.name}`, file, { access: 'public' });

    const dbFile = await prisma.communityFile.create({
        data: {
            title: file.name,
            fileUrl: blob.url,
            fileType: file.type.includes('pdf') ? 'PDF' : 'EPUB',
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