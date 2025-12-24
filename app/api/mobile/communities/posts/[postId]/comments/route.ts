import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Buscar comentários de um post
export async function GET(req: Request, { params }: { params: { postId: string } }) {
    try {
        const comments = await prisma.communityComment.findMany({
            where: { postId: params.postId },
            orderBy: { createdAt: 'asc' },
            include: {
                author: { select: { name: true, image: true, id: true } }
            }
        });
        return NextResponse.json(comments);
    } catch (e) {
        return NextResponse.json({ error: "Erro ao buscar comentários" }, { status: 500 });
    }
}

// POST: Criar comentário
export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } catch { return NextResponse.json({ status: 401 }); }

  try {
    const { content } = await req.json();
    if (!content.trim()) return NextResponse.json({ error: "Vazio" }, { status: 400 });

    const comment = await prisma.communityComment.create({
        data: {
            content,
            postId: params.postId,
            authorId: userId
        },
        include: {
            author: { select: { name: true, image: true } }
        }
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao comentar" }, { status: 500 });
  }
}