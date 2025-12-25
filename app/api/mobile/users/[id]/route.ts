import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  let currentUserId: string | null = null;

  // 1. Tentar identificar quem está visitando o perfil
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // CORREÇÃO CRÍTICA: O payload do login usa 'userId', não 'id'
      currentUserId = decoded.userId; 
    } catch (e) {
      // Token inválido ou expirado, segue como visitante anônimo
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
          // CORREÇÃO DA BIBLIOTECA VAZIA:
          // Removido 'where: { sharable: true }' para mostrar todos os livros
          // Se quiser voltar com a privacidade depois, descomente a linha abaixo.
          // where: { sharable: true }, 
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true, title: true, author: true, coverUrl: true, progress: true,
          }
        }
      }
    });

    if (!userProfile) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // 2. Verificar se o visitante já segue esse perfil
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

    return NextResponse.json({ ...userProfile, isFollowing });

  } catch (error) {
    console.error("Erro GET Profile:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}