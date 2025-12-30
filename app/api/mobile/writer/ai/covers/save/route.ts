import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    let userId: string | undefined;

    // ------------------------------------------------------------------
    // 1. AUTENTICAÇÃO (Híbrida: Mobile JWT + Web Session)
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
        const decoded = jwt.verify(token, secret) as { userId: string };
        userId = decoded.userId;
      } catch (err) {
        console.warn("[Auth Save] Token mobile inválido");
      }
    }

    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // ------------------------------------------------------------------
    // 2. PROCESSAMENTO DA IMAGEM
    // ------------------------------------------------------------------
    const { draftId, imageUrl } = await req.json();

    if (!draftId || !imageUrl) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    let fileBuffer: Buffer;
    let contentType = 'image/png';

    // Cenário A: Imagem em Base64 (Vindo do n8n atualizado)
    if (imageUrl.startsWith('data:')) {
      // Formato: data:image/png;base64,iVBORw0KGgo...
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: "Formato Base64 inválido" }, { status: 400 });
      }

      contentType = matches[1]; // ex: image/png
      fileBuffer = Buffer.from(matches[2], 'base64');
    } 
    // Cenário B: Imagem via URL (Vindo do DALL-E ou URL externa)
    else {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error("Falha ao baixar imagem original");
      const arrayBuffer = await imageRes.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      contentType = imageRes.headers.get('content-type') || 'image/png';
    }

    // ------------------------------------------------------------------
    // 3. UPLOAD PARA VERCEL BLOB
    // ------------------------------------------------------------------
    const filename = `covers/${draftId}-${Date.now()}.${contentType.split('/')[1]}`;
    
    const blob = await put(filename, fileBuffer, { 
      access: 'public',
      contentType: contentType
    });

    // ------------------------------------------------------------------
    // 4. ATUALIZAR BANCO DE DADOS
    // ------------------------------------------------------------------
    await prisma.bookDraft.update({
      where: { id: draftId },
      data: { coverUrl: blob.url }
    });

    return NextResponse.json({ success: true, coverUrl: blob.url });

  } catch (error: any) {
    console.error("[COVER_SAVE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}