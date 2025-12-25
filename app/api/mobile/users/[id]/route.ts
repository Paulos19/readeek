import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Identificar quem está fazendo a requisição
  const authHeader = request.headers.get("authorization");
  let currentUserId: string | null = null;

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.id; // ou decoded.sub dependendo de como você gera o token
    } catch (e) {
      // Token inválido ou expirado, segue como visitante
    }
  }

  const targetUserId = params.id;

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        image: true,
        about: true,
        role: true,
        displayedInsigniaIds: true,
        _count: {
            select: { followers: true, following: true, books: true }
        },
        books: {
          where: { sharable: true }, // Apenas livros públicos
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true, title: true, author: true, coverUrl: true, progress: true,
          }
        }
      }
    });

    if (!userProfile) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // 2. Verificar se já segue (se estiver logado)
    let isFollowing = false;
    if (currentUserId) {
      const followCheck = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = !!followCheck;
    }

    // Retorna o perfil + o status boolean
    return NextResponse.json({ ...userProfile, isFollowing });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}