import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { draftId, imageUrl } = await req.json();

    // 1. Download da imagem gerada (se for URL externa) para re-upload no Blob
    // Se vier Base64, converte para Buffer. Vamos assumir URL externa temporária aqui.
    const imageRes = await fetch(imageUrl);
    const imageBlob = await imageRes.blob();

    // 2. Upload para Vercel Blob
    const filename = `covers/${draftId}-${Date.now()}.png`;
    const { url } = await put(filename, imageBlob, { access: 'public' });

    // 3. Atualizar Draft
    await prisma.bookDraft.update({
      where: { id: draftId },
      data: { coverUrl: url }
    });

    return NextResponse.json({ success: true, coverUrl: url });

  } catch (error) {
    console.error("[COVER_SAVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}