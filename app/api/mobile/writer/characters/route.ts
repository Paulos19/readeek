import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId, name, role, description } = body;

    const char = await prisma.draftCharacter.create({
      data: {
        draftId,
        name,
        role: role || 'Personagem',
        description: description || ''
      }
    });

    return NextResponse.json(char);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar personagem" }, { status: 500 });
  }
}

// Para deletar, usaremos uma rota dinâmica ou query params. 
// Para simplificar, vou adicionar DELETE aqui recebendo o ID no body ou searchParams
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if(!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

    try {
        await prisma.draftCharacter.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
    }
}