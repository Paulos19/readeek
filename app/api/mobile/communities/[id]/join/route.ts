import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  
  // 1. Busca a comunidade e senha
  const community = await prisma.community.findUnique({ where: { id: params.id } });
  if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

  // 2. Validação de Segurança
  if (community.visibility === 'PRIVATE' && community.password !== password) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
  }

  // 3. Adiciona o usuário como membro
  try {
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: params.id,
        role: 'MEMBER'
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Você já é membro ou ocorreu um erro." }, { status: 400 });
  }
}