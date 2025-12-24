// app/api/mobile/communities/[id]/join/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Necessário para comparar a senha

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  try {
    const body = await req.json();
    const passwordInput = body.password ? String(body.password).trim() : "";
    const communityId = params.id;

    // 2. Busca a comunidade
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    // 3. Validação de Segurança (Correção para Minúscula + Bcrypt)
    if (community.visibility === 'private') {
        if (community.password) {
            // Compara a senha digitada com o Hash do banco
            const isMatch = await bcrypt.compare(passwordInput, community.password);
            
            if (!isMatch) {
                return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
            }
        }
    }

    // 4. Verifica duplicidade de membro
    const existingMember = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId: userId,
                communityId: communityId
            }
        }
    });

    if (existingMember) {
        return NextResponse.json({ success: true, message: "Já é membro" });
    }

    // 5. Adiciona membro
    await prisma.communityMember.create({
      data: {
        userId: userId,
        communityId: communityId,
        role: 'MEMBER'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao entrar na comunidade." }, { status: 400 });
  }
}