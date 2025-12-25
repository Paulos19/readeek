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

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // CORREÇÃO AQUI: Mudamos de .id para .userId
      currentUserId = decoded.userId; 
      
    } catch (e) {
      // Token inválido, segue como visitante
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
          // ATENÇÃO AQUI PARA O PRÓXIMO PROBLEMA
          where: { sharable: true }, 
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true, title: true, author: true, coverUrl: true, progress: true,
          }
        }
      }
    });

    if (!userProfile) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

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
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}