import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken'; // Necessário para ler o token do mobile
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    let userId: string | undefined;

    // ------------------------------------------------------------------
    // 1. TENTATIVA MOBILE: Ler Header Authorization (Bearer Token)
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
        // Decodifica usando a mesma lógica do seu login mobile
        const decoded = jwt.verify(token, secret) as { userId: string };
        userId = decoded.userId;
      } catch (err) {
        console.warn("[Auth] Token mobile inválido ou expirado");
      }
    }

    // ------------------------------------------------------------------
    // 2. TENTATIVA WEB: Ler Cookie de Sessão (getServerSession)
    // ------------------------------------------------------------------
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    // Se nenhum dos dois métodos funcionou, retorna 401
    if (!userId) {
      return new NextResponse("Unauthorized - Token or Session missing", { status: 401 });
    }

    // ------------------------------------------------------------------
    // 3. Regra de Negócio (Créditos e Geração)
    // ------------------------------------------------------------------
    const { draftId, style, description, colors, genre } = await req.json();

    // Verificar e Debitar Créditos
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.credits < 1500) {
      return NextResponse.json({ error: "Saldo insuficiente (1500 necessários)" }, { status: 402 });
    }

    // Transação para garantir débito
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1500 } }
    });

    // Buscar dados do Draft para passar automaticamente
    const draft = await prisma.bookDraft.findUnique({
      where: { id: draftId },
      select: { title: true, user: { select: { name: true } } }
    });

    if (!draft) return new NextResponse("Draft not found", { status: 404 });

    // Chamar n8n
    const n8nUrl = process.env.N8N_GENERATOR_WEBHOOK_URL;
    if (!n8nUrl) throw new Error("N8N_GENERATOR_WEBHOOK_URL não configurada");

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': process.env.N8N_WEBHOOK_SECRET || '' 
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

    if (!n8nResponse.ok) {
      // Se falhar no n8n, devolvemos os créditos (opcional, mas boa prática)
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 1500 } }
      });
      throw new Error("Falha na comunicação com IA (Créditos estornados)");
    }

    const data = await n8nResponse.json();
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[COVER_GENERATE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}