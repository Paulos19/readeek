import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // 1. Autenticação (Quem está pedindo?)
  const authHeader = req.headers.get("Authorization");
  let userId = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (e) {
      // Se o token for inválido, seguimos como visitante (userId vazio)
    }
  }

  try {
    const { id } = params;

    // 2. Busca Dados Básicos + Status de Membro do Usuário
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        owner: { select: { name: true, image: true, id: true } },
        // Verifica APENAS se o usuário atual é membro
        members: { 
            where: { userId: userId },
            select: { role: true }
        }
      }
    });

    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    // 3. Verifica Permissões
    const isMember = community.members.length > 0; // Se retornou algo no array members filtrado, é membro
    const isOwner = community.ownerId === userId;
    const isPrivate = community.visibility === 'private'; // minúscula conforme padrão definido

    // Se for Privada E (não é membro E não é dono) -> BLOQUEAR CONTEÚDO
    if (isPrivate && !isMember && !isOwner) {
        return NextResponse.json({
            ...community,
            posts: [], // Retorna vazio
            files: [], // Retorna vazio
            members: [], // Não lista outros membros
            isLocked: true, // Flag para o Frontend saber que está bloqueado
            isMember: false
        });
    }

    // 4. Se tiver permissão, busca o conteúdo completo
    const [posts, files, allMembers] = await Promise.all([
        prisma.communityPost.findMany({
            where: { communityId: id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                author: { select: { name: true, image: true, id: true } },
                _count: { select: { comments: true, reactions: true } }
            }
        }),
        prisma.communityFile.findMany({
            where: { communityId: id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        }),
        prisma.communityMember.findMany({
            where: { communityId: id },
            take: 10, // Apenas preview dos membros
            include: { user: { select: { name: true, image: true } } }
        })
    ]);

    return NextResponse.json({
        ...community,
        posts,
        files,
        members: allMembers,
        isLocked: false,
        isMember: isMember || isOwner
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}