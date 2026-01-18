import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;

  try {
    // 1. Verifica autenticação (Opcional, mas recomendado para saber se o usuário é dono)
    const authHeader = req.headers.get("authorization");
    let currentUserId = "";

    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (e) {}
    }

    // 2. Busca o jogo completo, incluindo o HTML e dados do dono
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, image: true } //
        },
        purchases: {
          where: { userId: currentUserId },
          select: { id: true }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    // 3. Formata a resposta
    const formattedGame = {
      ...game,
      // O campo isOwned é importante para o front saber se mostra o botão "Jogar" ou "Comprar"
      // Se for o dono OU se tiver comprado, é true
      isOwned: game.ownerId === currentUserId || game.purchases.length > 0, 
      // IMPORTANTE: Aqui enviamos o htmlContent, diferente da rota de listagem
      htmlContent: game.htmlContent 
    };

    return NextResponse.json(formattedGame);

  } catch (error) {
    console.error("Erro ao buscar detalhes do jogo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}