import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userId = params.id;

    // Busca registros na tabela de relacionamento (Follows)
    // Assumindo que o model se chama 'Follows' ou similar
    // onde 'followingId' é quem está sendo seguido (o usuário do perfil)
    const followersRel = await prisma.follows.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: { // Inclui os dados de quem está seguindo
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            // Adicione outros campos se necessário
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Mapeia para retornar uma lista limpa de usuários
    const followers = followersRel.map(f => f.followerId);

    return NextResponse.json(followers);

  } catch (error) {
    console.error("[FOLLOWERS_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar seguidores" }, { status: 500 });
  }
}