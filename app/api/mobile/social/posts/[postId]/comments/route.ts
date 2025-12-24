import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = await params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { reactions: true } },
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
        text: content,
        postId,
        userId,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { reactions: true } }
      }
    });

    const formattedComment = { ...comment, content: comment.text };
    return NextResponse.json(formattedComment);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao comentar" }, { status: 500 });
  }
}