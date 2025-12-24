import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// DELETE: Apagar Post
export async function DELETE(req: Request, { params }: { params: { postId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } 
  catch { return NextResponse.json({ status: 401 }); }

  const { postId } = await params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.post.delete({ where: { id: postId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar post" }, { status: 500 });
  }
}

// GET: Buscar Post Único (Opcional, útil para deep linking)
export async function GET(req: Request, { params }: { params: { postId: string } }) {
    const { postId } = await params;
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: { select: { name: true, image: true } },
                book: true,
                _count: { select: { reactions: true, comments: true } }
            }
        });
        if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(post);
    } catch(e) {
        return NextResponse.json({ error: "Erro ao buscar post" }, { status: 500 });
    }
}