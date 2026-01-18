import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Token simples para evitar que qualquer um chame essa rota
const WEBHOOK_SECRET = process.env.N8N_SECRET || "readeek-secure-key";

export async function POST(req: Request) {
  try {
    const { secret, gameId, htmlContent, coverUrl } = await req.json();

    // Segurança básica
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!gameId || !htmlContent) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Atualiza o jogo com o código final da IA
    const updated = await prisma.game.update({
      where: { id: gameId },
      data: {
        htmlContent: htmlContent,
        coverUrl: coverUrl || undefined, // Se a IA gerou capa, atualiza
      }
    });

    console.log(`[AI] Jogo ${updated.title} atualizado via N8N!`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}