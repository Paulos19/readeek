import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const N8N_WEBHOOK_URL = process.env.N8N_GAME_GEN_WEBHOOK;

// DEFINIÇÃO ROBUSTA DA URL BASE (CORREÇÃO DO ERRO)
const BASE_URL = process.env.NEXTAUTH_URL;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Validação e Payload
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const { prompt, title, orientation } = await req.json();

    // Validação de Segurança do Webhook
    if (!N8N_WEBHOOK_URL) {
      console.error("ERRO CRÍTICO: N8N_GAME_GEN_WEBHOOK não definido no .env");
      return NextResponse.json({ error: "Configuração de servidor inválida" }, { status: 500 });
    }

    const COST = 1500;

    // 2. Transação: Descontar Créditos e Criar Placeholder
    const game = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.credits < COST) {
        throw new Error("Saldo insuficiente");
      }

      // Desconta créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST } }
      });

      // HTML de "Loading" (Isso aparece imediatamente no marketplace enquanto o N8N trabalha)
      const loadingHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body { background-color: #000; color: #0f0; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .loader { border: 4px solid #333; border-top: 4px solid #0f0; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-top: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .status { margin-top: 10px; font-size: 12px; opacity: 0.8; }
            </style>
            <script>
                // Opcional: Recarregar a página a cada 10s para verificar se o jogo chegou
                setTimeout(() => window.location.reload(), 10000);
            </script>
        </head>
        <body>
          <div>
            <h1>SISTEMA READEEK AI</h1>
            <p>Conectando ao Agente Neural...</p>
            <p>Compilando: "${title || 'Novo Jogo'}"</p>
            <div class="loader"></div>
            <p class="status">Aguarde a injeção do código via N8N...</p>
          </div>
        </body>
        </html>
      `;

      // Cria o jogo no banco (Já visível no Marketplace)
      return await tx.game.create({
        data: {
          title: title || "Jogo Gerado por IA",
          description: `Gerado com prompt: ${prompt}`,
          htmlContent: loadingHtml,
          orientation: orientation || "PORTRAIT",
          price: 15,
          ownerId: userId,
          coverUrl: "https://placehold.co/400x600/000000/FFF?text=AI+Generating", // Capa provisória
        }
      });
    });

    // 3. Dispara o N8N (Com AWAIT para garantir o envio)
    try {
      console.log(`[AI] Disparando N8N para Game ID: ${game.id}`);
      
      // AQUI ESTAVA O ERRO: callbackUrl agora usa a const BASE_URL definida no topo
      const callbackUrl = `${BASE_URL}/api/webhooks/games/update`;
      console.log(`[AI] URL de Retorno: ${callbackUrl}`);

      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          prompt: prompt,
          orientation: orientation,
          callbackUrl: callbackUrl 
        })
      });

      if (!n8nResponse.ok) {
        console.error(`[AI] Erro no N8N: ${n8nResponse.status} ${n8nResponse.statusText}`);
      } else {
        console.log("[AI] Webhook enviado com sucesso!");
      }
    } catch (webhookError) {
      console.error("[AI] Falha de conexão com N8N:", webhookError);
    }

    return NextResponse.json({ success: true, gameId: game.id });

  } catch (error: any) {
    console.error("[AI Generate] Erro:", error);
    if (error.message === "Saldo insuficiente") {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}