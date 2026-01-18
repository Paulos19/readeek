import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const body = await req.json();
    const { title, description, htmlContent, orientation, mode } = body; 
    // mode: 'IMPORT' (45) | 'CREATE' (60)

    const cost = mode === 'CREATE' ? 60 : 45;

    // 1. Transação Atômica: Verifica saldo -> Deduz -> Cria Jogo
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.credits < cost) {
        throw new Error("Saldo insuficiente");
      }

      // Deduz créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } }
      });

      // Cria o Jogo
      const newGame = await tx.game.create({
        data: {
          title,
          description,
          htmlContent, // Aqui entra o HTML stringão
          orientation: orientation || 'PORTRAIT',
          ownerId: userId,
          price: 15 // Valor fixo de venda conforme requisito
        }
      });

      return newGame;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === "Saldo insuficiente") {
      return NextResponse.json({ error: "Você não tem créditos suficientes." }, { status: 402 });
    }
    console.error("Erro ao criar game:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}