import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const communities = await prisma.community.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true, posts: true }
        },
        members: {
            take: 3,
            include: { user: { select: { image: true } } }
        }
      }
    });

    return NextResponse.json(communities);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar comunidades" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, type, visibility } = body;

  try {
    const community = await prisma.community.create({
      data: {
        name,
        description,
        type, // Ex: 'BookClub', 'General'
        visibility, // 'PUBLIC' or 'PRIVATE'
        owner: { connect: { email: session.user.email } },
        members: {
            create: {
                userId: session.user.id,
                role: 'OWNER'
            }
        }
      },
    });
    return NextResponse.json(community);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar comunidade" }, { status: 500 });
  }
}