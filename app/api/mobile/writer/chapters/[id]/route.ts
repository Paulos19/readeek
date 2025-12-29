import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Carregar o conteúdo do capítulo para edição
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const chapter = await prisma.draftChapter.findUnique({
      where: { id: params.id }
    });

    if (!chapter) return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });

    return NextResponse.json(chapter);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT: Salvar alterações (Título e Conteúdo)
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await req.json();
    const { title, content } = body;

    const updatedChapter = await prisma.draftChapter.update({
      where: { id: params.id },
      data: {
        title,
        content,
        updatedAt: new Date() // Força atualização do timestamp
      }
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("Erro ao salvar capítulo:", error);
    return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
  }
}