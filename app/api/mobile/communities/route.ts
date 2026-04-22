// app/api/mobile/communities/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Necessário para encriptar a senha

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// Helper de Autenticação JWT
const getMobileUser = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};

// GET: Listagem
export async function GET(req: Request) {
  try {
    const communities = await prisma.community.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, posts: true } },
        members: { take: 3, include: { user: { select: { image: true } } } }
      }
    });
    return NextResponse.json(communities);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar comunidades" }, { status: 500 });
  }
}

// POST: Criação
export async function POST(req: Request) {
  const user = getMobileUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Detecta se é FormData ou JSON
    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let description: string | undefined;
    let type = "GENERAL";
    let rawVisibility = "public";
    let rawPassword: string | undefined;
    let coverUrl: string | null = null;
    let imageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string || "").trim();
      description = (formData.get("description") as string || "").trim() || undefined;
      type = (formData.get("type") as string) || "GENERAL";
      rawVisibility = (formData.get("visibility") as string) || "public";
      rawPassword = formData.get("password") as string || undefined;
      coverUrl = formData.get("coverUrl") as string || null;

      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        imageFile = file;
      }
    } else {
      const payload = await req.json();
      name = (payload.name || "").trim();
      description = payload.description?.trim();
      type = payload.type || "GENERAL";
      rawVisibility = payload.visibility || "public";
      rawPassword = payload.password;
      coverUrl = payload.coverUrl || null;
    }

    // Validação básica
    if (!name) {
      return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
    }

    // Normalização de visibilidade
    const visibility = rawVisibility?.toLowerCase() === 'private' ? 'private' : 'public';

    // Encriptação da senha
    let finalPassword = null;
    if (visibility === 'private' && rawPassword && rawPassword.trim() !== '') {
      finalPassword = await bcrypt.hash(rawPassword.trim(), 10);
    }

    // Upload da imagem de capa se houver
    if (imageFile) {
      try {
        const uploaded = await utapi.uploadFiles(imageFile);
        if (uploaded.data?.ufsUrl) {
          coverUrl = uploaded.data.ufsUrl;
        }
      } catch (uploadError) {
        console.error("Erro no upload da capa:", uploadError);
        // Continua sem capa em caso de falha
      }
    }

    // Salvar no Banco
    const community = await prisma.community.create({
      data: {
        name,
        description,
        type,
        coverUrl,
        visibility,
        password: finalPassword,
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
