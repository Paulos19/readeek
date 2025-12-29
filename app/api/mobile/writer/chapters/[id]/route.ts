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
    console.error("Erro ao carregar capítulo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH: Salvar alterações (Título e Conteúdo - Auto-Save)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, wallpaperUrl, textColor } = await req.json();
    
    const chapter = await prisma.draftChapter.update({
      where: { id: params.id },
      data: {
        title,
        content,
        wallpaperUrl, // Salva a URL persistente
        textColor,    // Salva a preferência de cor
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
// DELETE: Excluir um capítulo específico
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await prisma.draftChapter.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar capítulo:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}