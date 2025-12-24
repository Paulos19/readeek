import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = authHeader.split(" ")[1];
  
  let userId = "";
  try { userId = (jwt.verify(token, JWT_SECRET) as any).userId; } catch { return NextResponse.json({ status: 401 }); }

  try {
    const { emoji } = await req.json(); // Padrão "heart" ou "❤️"
    
    const existing = await prisma.communityReaction.findUnique({
        where: {
            userId_postId: { userId, postId: params.postId }
        }
    });

    if (existing) {
        // Se já curtiu, remove (Toggle OFF)
        await prisma.communityReaction.delete({
            where: { id: existing.id }
        });
        return NextResponse.json({ action: 'removed' });
    } else {
        // Se não curtiu, adiciona (Toggle ON)
        await prisma.communityReaction.create({
            data: {
                userId,
                postId: params.postId,
                emoji: emoji || '❤️'
            }
        });
        return NextResponse.json({ action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro na reação" }, { status: 500 });
  }
}