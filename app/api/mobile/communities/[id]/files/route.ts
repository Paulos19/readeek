import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticação Manual JWT
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

  // 2. Verificação de Permissão (Tem que ser membro)
  const membership = await prisma.communityMember.findFirst({
    where: { communityId: params.id, userId: userId }
  });

  if (!membership) {
      return NextResponse.json({ error: "Apenas membros podem enviar arquivos." }, { status: 403 });
  }

  // 3. Processamento do Arquivo
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

    // Upload para Vercel Blob
    const blob = await put(`community/${params.id}/${file.name}`, file, { access: 'public' });

    // Salvar no Banco
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