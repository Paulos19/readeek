import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } 
  catch { return NextResponse.json({ status: 401 }); }

  try {
    const { content, type, bookId } = await req.json();

    if (!content.trim()) return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });

    // Se for EXCERPT (Citação), o livro é obrigatório
    if (type === 'EXCERPT' && !bookId) {
        return NextResponse.json({ error: "Citações precisam de um livro selecionado." }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content,
        type: type || 'POST',
        userId,
        // Agora aceita bookId para qualquer tipo, ou undefined se for nulo
        bookId: bookId || undefined, 
      },
      include: {
        user: { select: { name: true, image: true } },
        book: true
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error(error); // Log para debug
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}