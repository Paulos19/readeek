import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (query.length < 1) return NextResponse.json([]);

  try {
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: params.id,
        user: {
          name: { contains: query, mode: 'insensitive' }
        }
      },
      take: 5,
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    });

    // Formata para devolver apenas dados do usuário
    const users = members.map(m => m.user);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}