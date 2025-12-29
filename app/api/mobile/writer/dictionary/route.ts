import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Retorna todas as palavras customizadas do usuário
export async function GET(req: NextRequest) {
  // Simulação de auth (ajuste conforme seu middleware)
  const userId = req.headers.get("x-user-id"); // Ou lógica de sessão
  if (!userId) return NextResponse.json({ words: [] }); // Fallback vazio

  try {
    const words = await prisma.userDictionary.findMany({
      where: { userId },
      select: { word: true }
    });
    return NextResponse.json({ words: words.map(w => w.word) });
  } catch (error) {
    return NextResponse.json({ words: [] });
  }
}

// POST: Adiciona uma palavra
export async function POST(req: NextRequest) {
  const { word, userId } = await req.json(); // userId vindo do front ou sessão

  try {
    await prisma.userDictionary.create({
      data: { word, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao adicionar" }, { status: 500 });
  }
}