import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const buyerId = decoded.userId;
    const gameId = params.id;

    // Transação de economia entre usuários
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) throw new Error("Jogo não encontrado");

      // Se for o dono, não precisa comprar
      if (game.ownerId === buyerId) return;

      // Verifica se já comprou
      const existingPurchase = await tx.gamePurchase.findUnique({
        where: { userId_gameId: { userId: buyerId, gameId } }
      });
      if (existingPurchase) return; // Já possui, sucesso silencioso

      // Verifica saldo do comprador
      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer || buyer.credits < game.price) {
        throw new Error("Saldo insuficiente");
      }

      // 1. Tira do Comprador
      await tx.user.update({
        where: { id: buyerId },
        data: { credits: { decrement: game.price } }
      });

      // 2. Dá para o Criador
      await tx.user.update({
        where: { id: game.ownerId },
        data: { credits: { increment: game.price } }
      });

      // 3. Registra a compra e incrementa plays/vendas
      await tx.gamePurchase.create({
        data: {
          userId: buyerId,
          gameId: game.id,
          amount: game.price
        }
      });
      
      await tx.game.update({
        where: { id: gameId },
        data: { plays: { increment: 1 } }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.message === "Saldo insuficiente") {
      return NextResponse.json({ error: "Saldo insuficiente para jogar." }, { status: 402 });
    }
    return NextResponse.json({ error: "Erro na transação" }, { status: 500 });
  }
}