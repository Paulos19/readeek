// app/api/mobile/communities/[id]/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, action } = await req.json(); // action: 'BAN' | 'PROMOTE'

  // 1. Verifica se quem está pedindo é o DONO
  const requester = await prisma.communityMember.findFirst({
    where: { communityId: params.id, userId: session.user.id, role: 'OWNER' }
  });

  if (!requester) return NextResponse.json({ error: "Apenas o dono pode gerenciar membros" }, { status: 403 });

  try {
    if (action === 'BAN') {
       // Remove da tabela de membros e adiciona na de banidos (se existir essa lógica, ou só deleta)
       await prisma.communityMember.deleteMany({
         where: { communityId: params.id, userId: memberId }
       });
    } else if (action === 'PROMOTE') {
       await prisma.communityMember.updateMany({
         where: { communityId: params.id, userId: memberId },
         data: { role: 'HONORARY_MEMBER' }
       });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro na operação" }, { status: 500 });
  }
}