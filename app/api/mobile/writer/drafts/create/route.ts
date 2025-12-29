import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";
const COST_CREATE_DRAFT = 15;

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try {
    userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;
  } catch {
    return NextResponse.json({ status: 401 });
  }

  try {
    const { title, genre } = await req.json();

    // 1. Transaction para garantir atomicidade (desconta crédito E cria draft)
    const result = await prisma.$transaction(async (tx) => {
      // Pega usuário atualizado
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.credits < COST_CREATE_DRAFT) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Desconta créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: COST_CREATE_DRAFT } }
      });

      // Cria o Rascunho
      const draft = await tx.bookDraft.create({
        data: {
          title: title || "Sem Título",
          genre: genre || "Geral",
          userId
        }
      });

      return draft;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ error: "Saldo insuficiente (Necessário 15 CR)" }, { status: 402 });
    }
    console.error("Erro ao criar draft:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}