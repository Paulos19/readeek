import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Verifique seu import correto do prisma

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

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Agora recebemos 'theme' também
    const { title, content, wallpaperUrl, textColor, theme } = await req.json();
    
    // Filtramos undefined para não sobrescrever com nulo acidentalmente, 
    // embora o Prisma ignore undefined por padrão, é bom ser explícito.
    const dataToUpdate: any = { updatedAt: new Date() };
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;
    if (wallpaperUrl !== undefined) dataToUpdate.wallpaperUrl = wallpaperUrl;
    if (textColor !== undefined) dataToUpdate.textColor = textColor;
    if (theme !== undefined) dataToUpdate.theme = theme;

    const chapter = await prisma.draftChapter.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await prisma.draftChapter.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}