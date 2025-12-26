import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userId = params.id;

    const followingRel = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: { // O objeto do usuário seguido está aqui
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // CORREÇÃO: Retornar o objeto 'following'
    const following = followingRel.map(f => f.following);

    return NextResponse.json(following);

  } catch (error) {
    console.error("[FOLLOWING_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar seguindo" }, { status: 500 });
  }
}