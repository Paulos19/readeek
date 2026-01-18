import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const N8N_WEBHOOK_URL = process.env.N8N_GAME_GEN_WEBHOOK; // Configure isso no .env

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Auth & Payload
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const { prompt, title, orientation } = await req.json();

    const COST = 1500;

    // 2. Transação: Descontar Créditos e Criar Placeholder
    const game = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.credits < COST) {
        throw new Error("Saldo insuficiente");
      }

      // Desconta
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST } }
      });

      // HTML de "Loading" enquanto a IA trabalha
      const loadingHtml = `
        <!DOCTYPE html>
        <html>
        <body style="background:#000;color:#0f0;display:flex;justify-content:center;align-items:center;height:100vh;font-family:monospace;">
          <div style="text-align:center">
            <h1>SISTEMA READEEK</h1>
            <p>Compilando rede neural...</p>
            <p>Aguarde a injeção do código via satélite N8N.</p>
            <div class="loader"></div>
          </div>
        </body>
        </html>
      `;

      // Cria o jogo
      return await tx.game.create({
        data: {
          title: title || "Jogo Gerado por IA",
          description: `Gerado com prompt: ${prompt}`,
          htmlContent: loadingHtml, // Placeholder
          orientation: orientation || "PORTRAIT",
          price: 15, // Preço padrão de venda
          ownerId: userId,
          coverUrl: "https://placehold.co/400x600/000000/FFF?text=AI+Generating", // Capa provisória
        }
      });
    });

    // 3. Dispara o N8N (Fire and Forget - não esperamos a resposta completa da IA aqui)
    // Enviamos o ID do jogo para o N8N saber onde salvar depois
    fetch(N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: game.id,
        prompt: prompt,
        orientation: orientation,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/games/update`
      })
    }).catch(err => console.error("Erro ao chamar N8N:", err));

    return NextResponse.json({ success: true, gameId: game.id });

  } catch (error: any) {
    if (error.message === "Saldo insuficiente") {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}