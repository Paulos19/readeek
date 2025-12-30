import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Obter detalhes
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
          select: { id: true, title: true, order: true, updatedAt: true, content: true } // content necessário para contagem de palavras
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

// PATCH: Atualizar Rascunho (NOVO)
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  // 1. Auth Check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ status: 401 });
  }

  try {
    const draftId = params.id;
    const body = await req.json();

    // Verifica propriedade
    const draft = await prisma.bookDraft.findUnique({ where: { id: draftId } });
    if (!draft || draft.userId !== userId) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Atualiza apenas campos permitidos
    const dataToUpdate: any = { updatedAt: new Date() };
    if (body.title) dataToUpdate.title = body.title;
    if (body.genre) dataToUpdate.genre = body.genre;
    if (body.coverUrl !== undefined) dataToUpdate.coverUrl = body.coverUrl;

    const updatedDraft = await prisma.bookDraft.update({
      where: { id: draftId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedDraft);

  } catch (error) {
    console.error("Erro PATCH draft:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Excluir Rascunho
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ status: 401 });
  }

  try {
    const draftId = params.id;
    const draft = await prisma.bookDraft.findUnique({ where: { id: draftId } });

    if (!draft) return NextResponse.json({ error: "Rascunho não encontrado" }, { status: 404 });
    if (draft.userId !== userId) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    await prisma.bookDraft.delete({ where: { id: draftId } });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno ao deletar" }, { status: 500 });
  }
}