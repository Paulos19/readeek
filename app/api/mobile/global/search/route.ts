import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Busca Paralela no Banco de Dados
    const [users, books] = await Promise.all([
      // 1. Buscar Usuários
      prisma.user.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        select: { id: true, name: true, image: true, role: true },
        take: 5
      }),
      // 2. Buscar Livros
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, author: true, coverUrl: true },
        take: 5
      })
    ]);

    // Formata para o padrão visual do frontend
    const results = [
      ...users.map(u => ({
        id: u.id,
        type: 'USER',
        title: u.name || 'Sem nome',
        subtitle: u.role === 'ADMIN' ? 'Administrador' : 'Leitor',
        image: u.image
      })),
      ...books.map(b => ({
        id: b.id,
        type: 'BOOK',
        title: b.title,
        subtitle: b.author || 'Autor desconhecido',
        image: b.coverUrl
      }))
    ];

    return NextResponse.json(results);

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}