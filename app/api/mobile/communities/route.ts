import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { put } from "@vercel/blob";

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

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const visibility = formData.get("visibility") as 'PUBLIC' | 'PRIVATE';
    const password = formData.get("password") as string | null;
    const file = formData.get("cover") as File | null;
    
    // CORREÇÃO: Pegar o tipo ou definir um padrão
    const type = formData.get("type") as string || "GENERAL"; 

    let coverUrl = null;

    if (file) {
        const blob = await put(`communities/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });
        coverUrl = blob.url;
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        type,      // <--- CAMPO ADICIONADO AQUI
        coverUrl,  // <--- CAMPO DE CAPA
        visibility,
        password: (visibility === 'PRIVATE' && password) ? password : null,
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
    console.error("Erro ao criar comunidade:", error);
    return NextResponse.json({ error: "Erro ao criar comunidade" }, { status: 500 });
  }
}