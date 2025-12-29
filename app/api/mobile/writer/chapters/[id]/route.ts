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
    const body = await req.json();
    
    // Filtra apenas o que foi enviado (undefined vs null vs valor)
    // Isso impede que um auto-save de texto apague o wallpaperUrl se ele não for enviado
    const dataToUpdate: any = { updatedAt: new Date() };
    
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.content !== undefined) dataToUpdate.content = body.content;
    if (body.wallpaperUrl !== undefined) dataToUpdate.wallpaperUrl = body.wallpaperUrl;
    if (body.textColor !== undefined) dataToUpdate.textColor = body.textColor;
    if (body.theme !== undefined) dataToUpdate.theme = body.theme;

    const chapter = await prisma.draftChapter.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Erro PATCH chapter:", error);
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