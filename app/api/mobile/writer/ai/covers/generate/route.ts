import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { draftId, style, description, colors, genre } = await req.json();

    // 1. Verificar e Debitar Créditos
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user || user.credits < 1500) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
    }

    // Transação para garantir débito
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1500 } }
    });

    // 2. Buscar dados do Draft para passar automaticamente
    const draft = await prisma.bookDraft.findUnique({
      where: { id: draftId },
      select: { title: true, user: { select: { name: true } } }
    });

    if (!draft) return new NextResponse("Draft not found", { status: 404 });

    // 3. Chamar n8n
    const n8nResponse = await fetch(process.env.N8N_GENERATOR_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': process.env.N8N_WEBHOOK_SECRET! 
      },
      body: JSON.stringify({
        title: draft.title,
        author: draft.user.name,
        genre,
        style,
        description,
        colors
      })
    });

    if (!n8nResponse.ok) throw new Error("Falha na geração AI");

    const data = await n8nResponse.json();
    
    // data.covers deve vir do n8n contendo [{id: 1, url: '...'}, {id: 2, url: '...'}]
    return NextResponse.json(data);

  } catch (error) {
    console.error("[COVER_GENERATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}