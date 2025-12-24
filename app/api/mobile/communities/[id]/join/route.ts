import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticação Manual JWT
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

  // 2. Lógica de Entrada
  try {
    const { password } = await req.json();
    const communityId = params.id;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    // Verifica Senha se for Privada
    if (community.visibility === 'PRIVATE') {
        if (community.password && community.password !== password) {
            return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
        }
    }

    // Cria a relação
    await prisma.communityMember.create({
      data: {
        userId: userId,
        communityId: communityId,
        role: 'MEMBER'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Retorna erro se o usuário já for membro (Unique Constraint)
    return NextResponse.json({ error: "Você já é membro desta comunidade." }, { status: 400 });
  }
}