import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get("Authorization");
  let userId = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (e) {}
  }

  try {
    const { id } = params;

    // 1. Busca Dados e Relação do Usuário
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        owner: { select: { name: true, image: true, id: true } },
        // Traz apenas a relação do usuário ATUAL para checar permissões
        members: { 
            where: { userId: userId },
            select: { role: true }
        }
      }
    });

    if (!community) return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    const isOwner = community.ownerId === userId;
    const userMembership = community.members[0]; // Existirá se for membro
    const isMember = !!userMembership;
    const isPrivate = community.visibility === 'private';

    // Define o cargo do usuário atual (OWNER, HONORARY_MEMBER, MEMBER ou null)
    const currentUserRole = isOwner ? 'OWNER' : (userMembership?.role || null);

    // Bloqueio de Conteúdo (Privado & Não Membro)
    if (isPrivate && !isMember && !isOwner) {
        return NextResponse.json({
            ...community,
            posts: [],
            files: [],
            members: [],
            isLocked: true,
            isMember: false,
            currentUserRole: null // Sem cargo
        });
    }

    // Busca Conteúdo Completo
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
            take: 10,
            include: { user: { select: { name: true, image: true } } }
        })
    ]);

    return NextResponse.json({
        ...community,
        posts,
        files,
        // O array 'members' aqui é a lista pública de participantes, sobrescrevendo a busca individual do passo 1
        members: allMembers, 
        isLocked: false,
        isMember: isMember || isOwner,
        currentUserRole // <--- Enviando o cargo explicitamente
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}