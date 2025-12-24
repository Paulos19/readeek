import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request) {
  // Autenticação opcional para saber quem curtiu, etc.
  const authHeader = req.headers.get("Authorization");
  let userId = "";
  if (authHeader) {
      try {
        userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
      } catch (e) {}
  }

  try {
    // CORREÇÃO: Removido filtro de seguidores para mostrar FEED GLOBAL
    // Isso garante que posts de outros usuários apareçam mesmo sem seguir ninguém.
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { 
            select: { 
                id: true, 
                name: true, 
                image: true, 
                role: true 
            } 
        },
        book: { 
            select: { 
                id: true, 
                title: true, 
                coverUrl: true, 
                author: true 
            } 
        },
        _count: { 
            select: { 
                comments: true, 
                reactions: true 
            } 
        },
        // Verifica se o usuário atual curtiu (para o frontend pintar o coração)
        reactions: {
            where: { userId: userId, emoji: '❤️' },
            select: { id: true }
        }
      }
    });

    // Mapeia para adicionar campo booleano 'isLiked'
    const formattedPosts = posts.map(post => ({
        ...post,
        isLiked: post.reactions.length > 0
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar feed" }, { status: 500 });
  }
}