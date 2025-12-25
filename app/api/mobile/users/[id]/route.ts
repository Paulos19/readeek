import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Verificação de Segurança (Token)
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);

    const targetUserId = params.id;

    // 2. Buscar dados do usuário alvo
    const userProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        image: true,
        about: true, // A "Bio"
        role: true,
        createdAt: true,
        // Contadores para o futuro
        _count: {
            select: {
                followers: true,
                following: true,
                books: true
            }
        },
        // Insígnias (apenas as IDs ou dados completos se necessário)
        displayedInsigniaIds: true, 
        
        // Livros do usuário
        books: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            author: true,
            coverUrl: true,
            progress: true, // A porcentagem de leitura
            updatedAt: true,
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(userProfile);

  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}