import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId = "";
  try { userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; } 
  catch { return NextResponse.json({ status: 401 }); }

  const { postId } = await params;

  try {
    // Verifica se já curtiu para dar toggle
    const existing = await prisma.reaction.findFirst({
        where: {
            postId,
            userId,
            emoji: '❤️' 
        }
    });

    if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: 'removed' });
    } else {
        await prisma.reaction.create({
            data: {
                postId,
                userId,
                emoji: '❤️'
            }
        });
        return NextResponse.json({ action: 'added' });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao reagir" }, { status: 500 });
  }
}