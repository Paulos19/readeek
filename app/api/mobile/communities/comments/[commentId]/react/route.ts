import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { commentId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } catch { return NextResponse.json({ status: 401 }); }

  try {
    // Verifica se já existe reação deste usuário neste comentário
    const existing = await prisma.communityReaction.findFirst({
        where: { userId, commentId: params.commentId }
    });

    if (existing) {
        await prisma.communityReaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: 'removed' });
    } else {
        await prisma.communityReaction.create({
            data: { userId, commentId: params.commentId, emoji: '❤️' }
        });
        return NextResponse.json({ action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}