import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const followerId = decoded.id;
    const followingId = params.id;

    if (followerId === followingId) {
      return NextResponse.json({ error: "Você não pode seguir a si mesmo" }, { status: 400 });
    }

    // Verifica se já existe a relação
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Deixar de seguir (Unfollow)
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return NextResponse.json({ isFollowing: false });
    } else {
      // Seguir (Follow)
      await prisma.follows.create({
        data: {
          followerId,
          followingId,
        },
      });
      
      // Opcional: Criar notificação aqui
      
      return NextResponse.json({ isFollowing: true });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar ação" }, { status: 500 });
  }
}