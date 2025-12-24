import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { commentId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } 
  catch { return NextResponse.json({ status: 401 }); }

  try {
    const { commentId } = await params;

    // Verifica se já curtiu (Vamos assumir apenas ❤️ para simplificar, ou toggle)
    // Nota: O model 'Reaction' no seu schema não tem 'commentId' explícito ligado ao social post comment?
    // Verifiquei seu schema: O model `Reaction` (do feed social) só tem `postId`. 
    // Você NÃO tem reações em comentários do feed social no schema atual, apenas em `CommunityReaction`.
    
    // **AÇÃO NECESSÁRIA**: Você precisa adicionar suporte a reações em comentários no Schema.
    // Se não quiser mexer no schema agora, retorne um erro ou "fake success".
    
    // Vou assumir que você vai adicionar ou quer um placeholder. 
    // Como o schema `Reaction` só tem `postId`, tecnicamente não dá para curtir comentários do feed social ainda.
    
    return NextResponse.json({ message: "Funcionalidade pendente de atualização no banco" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao reagir" }, { status: 500 });
  }
}