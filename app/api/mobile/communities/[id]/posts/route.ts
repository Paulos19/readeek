import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];
  let userId = "";
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId;
  } catch { return NextResponse.json({ error: "Token inválido" }, { status: 401 }); }

  try {
    const { content } = await req.json();
    if (!content.trim()) return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });

    // Verifica se é membro
    const membership = await prisma.communityMember.findFirst({
        where: { communityId: params.id, userId }
    });

    if (!membership) return NextResponse.json({ error: "Permissão negada" }, { status: 403 });

    const post = await prisma.communityPost.create({
        data: {
            content,
            communityId: params.id,
            authorId: userId
        },
        include: {
            author: { select: { name: true, image: true, id: true } },
            _count: { select: { comments: true, reactions: true } }
        }
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}