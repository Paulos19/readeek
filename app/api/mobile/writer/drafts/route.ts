import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request) {
  // 1. Verificação de Segurança (Auth)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId;
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    // 2. Buscar os rascunhos do usuário no banco
    const drafts = await prisma.bookDraft.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        updatedAt: 'desc' // Os mais recentes primeiro
      },
      // Incluímos a contagem de capítulos para mostrar no card
      include: {
        _count: {
          select: { chapters: true }
        }
      }
    });

    return NextResponse.json(drafts);

  } catch (error) {
    console.error("[WRITER_DRAFTS_GET]", error);
    return NextResponse.json({ error: "Erro interno ao buscar rascunhos" }, { status: 500 });
  }
}