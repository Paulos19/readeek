import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const draftId = params.id;

    const draft = await prisma.bookDraft.findUnique({
      where: { id: draftId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, order: true, updatedAt: true }
        },
        characters: true,
        lore: true,
        _count: { select: { chapters: true } }
      }
    });

    if (!draft) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}