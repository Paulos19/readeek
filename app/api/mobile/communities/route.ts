// app/api/mobile/communities/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
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
    const formData = await req.formData();
    
    // 1. Sanitização Básica
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string)?.trim();
    const type = formData.get("type") as string || "GENERAL";
    
    // 2. Correção de Visibilidade (Web espera minúscula)
    const rawVisibility = (formData.get("visibility") as string)?.toLowerCase();
    const visibility = rawVisibility === 'private' ? 'private' : 'public';
    
    // 3. Tratamento e Encriptação da Senha
    const rawPassword = formData.get("password") as string;
    let finalPassword = null;

    if (visibility === 'private' && rawPassword && rawPassword.trim() !== '') {
        // Encripta a senha com custo 10 (padrão)
        finalPassword = await bcrypt.hash(rawPassword.trim(), 10);
    }

    // 4. Upload da Capa
    const file = formData.get("cover") as File | null;
    let coverUrl = null;

    if (file) {
        const blob = await put(`communities/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });
        coverUrl = blob.url;
    }

    // 5. Salvar no Banco
    const community = await prisma.community.create({
      data: {
        name,
        description,
        type,
        coverUrl,
        visibility, // Salva 'private' ou 'public' (minúsculo)
        password: finalPassword, // Salva o HASH, não o texto plano
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