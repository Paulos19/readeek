import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId, title } = body;

    // Descobrir a próxima ordem
    const lastChapter = await prisma.draftChapter.findFirst({
      where: { draftId },
      orderBy: { order: 'desc' }
    });

    const newOrder = (lastChapter?.order || 0) + 1;

    const chapter = await prisma.draftChapter.create({
      data: {
        title: title || `Capítulo ${newOrder}`,
        content: "", // Começa vazio
        order: newOrder,
        draftId
      }
    });

    return NextResponse.json(chapter);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar capítulo" }, { status: 500 });
  }
}