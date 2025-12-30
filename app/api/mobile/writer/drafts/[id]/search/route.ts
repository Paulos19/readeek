import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Atualizado para Next.js 15 (params como Promise)
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json([]);
    }

    // Busca capítulos que contêm o termo (Case Insensitive)
    const chapters = await prisma.draftChapter.findMany({
      where: {
        draftId: id,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Processa os resultados para retornar apenas snippets (trechos)
    const results = chapters.map((chapter) => {
      const lowerContent = chapter.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerContent.indexOf(lowerQuery);

      // Pega um trecho de 30 caracteres antes e 50 depois
      const start = Math.max(0, index - 30);
      const end = Math.min(chapter.content.length, index + lowerQuery.length + 50);
      const snippet = "..." + chapter.content.substring(start, end) + "...";

      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        snippet,
        matchIndex: index, // Posição exata para o editor usar
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}