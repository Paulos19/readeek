import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Obter detalhes (Já existia)
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

// --- ADICIONE ESTE BLOCO PARA CORRIGIR O ERRO 404 ---
export async function DELETE(
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

    // 2. Verifica se o rascunho pertence ao usuário antes de deletar
    const draft = await prisma.bookDraft.findUnique({ where: { id: draftId } });

    if (!draft) return NextResponse.json({ error: "Rascunho não encontrado" }, { status: 404 });
    if (draft.userId !== userId) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // 3. Deleta (Cascade vai apagar capítulos, lore e personagens automaticamente se configurado no schema)
    // Se não tiver cascade no banco, o Prisma lida com isso se configurado no schema.prisma
    await prisma.bookDraft.delete({
      where: { id: draftId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao deletar rascunho:", error);
    return NextResponse.json({ error: "Erro interno ao deletar" }, { status: 500 });
  }
}