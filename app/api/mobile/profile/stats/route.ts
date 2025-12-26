import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
  try {
    // 1. Extrair o token do header (Padrão Mobile)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // 2. Validar o token
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // 3. Buscar dados no banco
    const userStats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        role: true,
        profileVisibility: true,
        _count: {
          select: {
            followers: true,
            following: true,
            books: true,
          }
        }
      }
    });

    if (!userStats) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 4. Buscar sugestões (usuários que o atual ainda não segue)
    const suggestions = await prisma.user.findMany({
      where: {
        NOT: { id: userId },
        followers: {
          none: { followerId: userId }
        }
      },
      take: 5,
      select: {
        id: true,
        name: true,
        image: true,
      }
    });

    return NextResponse.json({
      stats: userStats,
      suggestions
    });

  } catch (error) {
    console.error("[Stats API Error]:", error);
    return NextResponse.json({ error: "Sessão expirada ou inválida" }, { status: 401 });
  }
}