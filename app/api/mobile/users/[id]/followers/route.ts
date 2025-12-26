import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userId = params.id;

    const followersRel = await prisma.follows.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: { // O objeto do usuário está aqui
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

    // CORREÇÃO: Retornar o objeto 'follower' inteiro, não apenas o ID
    const followers = followersRel.map(f => f.follower);

    return NextResponse.json(followers);

  } catch (error) {
    console.error("[FOLLOWERS_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar seguidores" }, { status: 500 });
  }
}