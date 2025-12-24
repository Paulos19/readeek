import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        owner: { select: { name: true, image: true, id: true } },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            author: { select: { name: true, image: true, id: true } },
            _count: { select: { comments: true, reactions: true } }
          }
        }
      }
    });

    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    return NextResponse.json(community);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}