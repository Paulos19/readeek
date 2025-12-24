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
    const { content, type, bookId } = await req.json(); // type: 'POST' | 'EXCERPT' | 'CHALLENGE'

    if (!content) return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });

    const post = await prisma.post.create({
      data: {
        content,
        type: type || 'POST',
        userId,
        bookId: bookId || undefined, // Opcional, só se for Excerpt
      },
      include: {
        user: { select: { name: true, image: true } },
        book: true
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}