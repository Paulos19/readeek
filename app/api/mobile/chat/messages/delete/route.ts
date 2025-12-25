import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { messageIds } = await request.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return NextResponse.json({ error: "Nenhuma mensagem selecionada" }, { status: 400 });
    }

    // Deleta apenas se o usuário for o dono da mensagem
    const result = await prisma.message.deleteMany({
      where: {
        id: { in: messageIds },
        senderId: userId // Segurança: só apaga as próprias
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao apagar mensagens" }, { status: 500 });
  }
}