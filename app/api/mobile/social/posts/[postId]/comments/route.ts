import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = await params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null }, // Busca apenas comentários raiz (não respostas aninhadas aqui, se quiser flat)
      // Se quiser aninhados, a lógica muda um pouco, mas para mobile flat é mais fácil ou buscamos tudo
      // Vamos buscar TUDO e ordenar no front ou buscar estruturado.
      // Versão simplificada: Busca todos
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { reactions: true } },
        // Se quiser saber se o usuário curtiu, precisaria de lógica extra, 
        // mas para MVP vamos retornar os dados básicos
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar comentários" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } 
  catch { return NextResponse.json({ status: 401 }); }

  try {
    const { content, parentId } = await req.json();
    const { postId } = await params;

    if (!content.trim()) return NextResponse.json({ error: "Comentário vazio" }, { status: 400 });

    const comment = await prisma.comment.create({
      data: {
        text: content, // No schema.prisma o campo é 'text' e não 'content' para o model Comment
        postId,
        userId,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { reactions: true } }
      }
    });

    // Mapeia para o formato que o front espera (content vs text)
    const formattedComment = {
      ...comment,
      content: comment.text, 
    };

    return NextResponse.json(formattedComment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao comentar" }, { status: 500 });
  }
}