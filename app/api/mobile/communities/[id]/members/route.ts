import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticação JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let userId = "";

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId;
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // 2. Lógica de Gestão
  try {
    const { memberId, action } = await req.json(); // action: 'BAN' | 'PROMOTE'

    // REGRA DE NEGÓCIO: Apenas o DONO (OWNER) pode gerenciar membros
    // Membros Honorários NÃO PASSARÃO nesta verificação.
    const requester = await prisma.communityMember.findFirst({
        where: { 
            communityId: params.id, 
            userId: userId, 
            role: 'OWNER' // <--- Trava de segurança
        }
    });

    if (!requester) {
        return NextResponse.json({ 
            error: "Permissão negada. Apenas o dono pode gerenciar membros." 
        }, { status: 403 });
    }

    // Impede que o dono bana a si mesmo (segurança extra)
    if (memberId === userId) {
        return NextResponse.json({ error: "Você não pode banir a si mesmo." }, { status: 400 });
    }

    if (action === 'BAN') {
       await prisma.communityMember.deleteMany({
         where: { communityId: params.id, userId: memberId }
       });
       // Opcional: Adicionar à tabela BannedFromCommunity
       await prisma.bannedFromCommunity.create({
           data: {
               userId: memberId,
               communityId: params.id
           }
       }).catch(() => {}); // Ignora se já estiver banido
       
    } else if (action === 'PROMOTE') {
       await prisma.communityMember.updateMany({
         where: { communityId: params.id, userId: memberId },
         data: { role: 'HONORARY_MEMBER' }
       });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao executar ação" }, { status: 500 });
  }
}