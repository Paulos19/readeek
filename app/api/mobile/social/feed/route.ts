import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  let userId = "";

  if (authHeader) {
      try {
        userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
      } catch (e) {}
  }

  try {
    // Busca posts do próprio usuário E de quem ele segue
    const posts = await prisma.post.findMany({
      where: {
        OR: [
            { userId: userId }, // Meus posts
            { user: { followers: { some: { followerId: userId } } } } // Quem eu sigo
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
        book: { select: { id: true, title: true, coverUrl: true, author: true } }, // Inclui dados do livro se for Citação
        _count: { select: { comments: true, reactions: true } }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar feed" }, { status: 500 });
  }
}