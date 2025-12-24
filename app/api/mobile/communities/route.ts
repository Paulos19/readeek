// app/api/mobile/communities/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import jwt from "jsonwebtoken";

// Segredo deve ser o mesmo usado no login mobile
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// Helper para validar usuário mobile
const getMobileUser = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  const token = authHeader.split(" ")[1];
  try {
    // Decodifica o token gerado no /api/mobile/auth/login
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};

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
  // 1. Autenticação via JWT (Mobile) em vez de Session Cookie
  const user = getMobileUser(req);
  if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const visibility = formData.get("visibility") as 'PUBLIC' | 'PRIVATE';
    const password = formData.get("password") as string | null;
    const file = formData.get("cover") as File | null;
    const type = formData.get("type") as string || "GENERAL";

    let coverUrl = null;

    if (file) {
        // Upload para o Vercel Blob
        const blob = await put(`communities/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });
        coverUrl = blob.url;
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        type,
        coverUrl,
        visibility,
        password: (visibility === 'PRIVATE' && password) ? password : null,
        // Conecta usando o ID do payload do token
        owner: { connect: { id: user.userId } },
        members: {
            create: {
                userId: user.userId,
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