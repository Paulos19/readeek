// app/api/mobile/communities/[id]/join/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  const communityId = params.id;

  try {
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    // Verifica Senha se for Privada
    if (community.visibility === 'PRIVATE') {
        if (community.password && community.password !== password) {
            return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
        }
    }

    // Adiciona Membro
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: communityId,
        role: 'MEMBER'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao entrar na comunidade" }, { status: 500 });
  }
}