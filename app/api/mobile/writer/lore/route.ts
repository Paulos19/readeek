import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId, title, category, content } = body;

    const lore = await prisma.draftLore.create({
      data: {
        draftId,
        title,
        category: category || 'Geral',
        content: content || ''
      }
    });

    return NextResponse.json(lore);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar lore" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if(!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

    try {
        await prisma.draftLore.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
    }
}