import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ status: 401 });
  
  const userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId;

  try {
    const existing = await prisma.reaction.findUnique({
      where: { userId_postId_emoji: { userId, postId: params.id, emoji: '❤️' } }
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed' });
    } else {
      await prisma.reaction.create({
        data: { userId, postId: params.id, emoji: '❤️' }
      });
      return NextResponse.json({ action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}