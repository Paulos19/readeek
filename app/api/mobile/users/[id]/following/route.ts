import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userId = params.id;

    // Busca registros onde 'followerId' é o usuário (ele está seguindo outros)
    const followingRel = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: { // Inclui os dados de quem está sendo seguido
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

    // Mapeia para retornar uma lista limpa de usuários
    const following = followingRel.map(f => f.followingId);

    return NextResponse.json(following);

  } catch (error) {
    console.error("[FOLLOWING_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar seguindo" }, { status: 500 });
  }
}