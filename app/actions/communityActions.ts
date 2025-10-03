"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, CommunityRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// --- TIPOS E FUNÇÕES DE RANKING ---

export type TopReader = Prisma.UserGetPayload<{
    select: {
        id: true;
        name: true;
        image: true;
        _count: {
            select: {
                posts: true;
                reactions: true;
                comments: true;
            }
        }
    }
}> & { score: number };

export async function getWeeklyTopReaders(): Promise<TopReader[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersWithActivity = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            posts: { where: { createdAt: { gte: sevenDaysAgo } } },
            reactions: { where: { post: { createdAt: { gte: sevenDaysAgo } } } },
            comments: { where: { createdAt: { gte: sevenDaysAgo } } },
          },
        },
      },
    });

    const scoredUsers = usersWithActivity.map(user => {
      const score = 
        (user._count.posts * 5) +
        (user._count.reactions * 1) +
        (user._count.comments * 2);
      return { ...user, score };
    });

    return scoredUsers
      .filter(user => user.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

  } catch (error) {
    console.error("Falha ao obter os leitores da semana:", error);
    return [];
  }
}

export async function getSuggestedUsers() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return prisma.user.findMany({
      orderBy: { followers: { _count: 'desc' } },
      take: 5,
    });
  }

  const followingIds = (await prisma.follows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  })).map(f => f.followingId);

  return prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        { id: { notIn: followingIds } },
      ],
    },
    orderBy: {
      followers: { _count: 'desc' },
    },
    take: 5,
  });
}

const calculateScore = (user: {
  _count: { posts: number; reactions: number; comments: number; };
}) => {
  return (user._count.posts * 5) + (user._count.reactions * 1) + (user._count.comments * 2);
};

export type FullRankingUser = Prisma.UserGetPayload<{
    select: {
        id: true;
        name: true;
        image: true;
        email: true;
        _count: {
            select: { posts: true; reactions: true; comments: true; }
        }
    }
}> & { score: number };

export async function getFullRanking({ page = 1, limit = 15 }: { page: number, limit: number }) {
  try {
    const skip = (page - 1) * limit;
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        _count: {
          select: {
            posts: true,
            reactions: true,
            comments: true,
          },
        },
      },
    });

    const scoredUsers = allUsers
      .map(user => ({ ...user, score: calculateScore(user) }))
      .sort((a, b) => b.score - a.score);
      
    const totalUsers = scoredUsers.length;
    const paginatedUsers = scoredUsers.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users: paginatedUsers as FullRankingUser[],
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Falha ao obter o ranking completo:", error);
    return { users: [], totalPages: 0, currentPage: 1 };
  }
}

// --- FUNÇÕES DE GESTÃO DA COMUNIDADE ---

const createCommunitySchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  type: z.enum(["study", "forum"]),
  visibility: z.enum(["public", "private"]),
  password: z.string().optional(),
});

export async function createCommunity(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const validatedFields = createCommunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };

  const { name, description, type, visibility, password } = validatedFields.data;

  if (visibility === "private" && !password) {
    return { error: "A senha é obrigatória para comunidades privadas." };
  }

  let hashedPassword = null;
  if (visibility === "private" && password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  try {
    const community = await prisma.community.create({
      data: {
        name,
        description,
        type,
        visibility,
        password: hashedPassword,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });
    revalidatePath("/communities");
    return { success: true, communityId: community.id };
  } catch (error) {
    return { error: "Não foi possível criar a comunidade." };
  }
}

const joinCommunitySchema = z.object({
  communityId: z.string(),
  password: z.string().optional(),
});

export async function joinCommunity(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Precisa de estar autenticado." };

  const validatedFields = joinCommunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { error: "Dados inválidos." };
  
  const { communityId, password } = validatedFields.data;
  const userId = session.user.id;

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return { error: "Comunidade não encontrada." };

  const isBanned = await prisma.bannedFromCommunity.findFirst({ where: { communityId, userId } });
  if (isBanned) return { error: "Não pode entrar nesta comunidade." };

  const isAlreadyMember = await prisma.communityMember.findFirst({ where: { communityId, userId } });
  if (isAlreadyMember) return { success: true, alreadyMember: true };

  if (community.visibility === "private") {
    if (!password || !community.password) return { error: "É necessária uma senha." };
    const isPasswordCorrect = await bcrypt.compare(password, community.password);
    if (!isPasswordCorrect) return { error: "Senha incorreta." };
  }

  try {
    await prisma.communityMember.create({
      data: { userId, communityId, role: "MEMBER" },
    });
    revalidatePath("/communities");
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível entrar na comunidade." };
  }
}

// --- FUNÇÕES DE INTERAÇÃO E MODERAÇÃO ---

const createCommunityPostSchema = z.object({
  content: z.string().min(1, "O post não pode estar vazio.").max(1000, "O post é demasiado longo."),
  communityId: z.string(),
});

export async function createCommunityPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const validatedFields = createCommunityPostSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };

  const { content, communityId } = validatedFields.data;

  const member = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId } },
  });

  if (!member) return { error: "Apenas membros podem publicar nesta comunidade." };

  try {
    await prisma.communityPost.create({
      data: { content, communityId, authorId: session.user.id },
    });
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error) {
    return { error: "Ocorreu um erro ao tentar publicar." };
  }
}

export async function reactToCommunityPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };
  const userId = session.user.id;

  try {
    const existingReaction = await prisma.communityReaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingReaction) {
      await prisma.communityReaction.delete({ where: { userId_postId: { userId, postId } } });
      revalidatePath(`/communities/`);
      return { success: true, removed: true };
    } else {
      await prisma.communityReaction.create({
        data: { userId, postId, emoji: "❤️" },
      });
      revalidatePath(`/communities/`);
      return { success: true, removed: false };
    }
  } catch (error) {
    return { error: "Não foi possível reagir à publicação." };
  }
}

export async function reportCommunityPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  try {
    const existingReport = await prisma.communityPostReport.findFirst({
        where: { postId, reporterId: session.user.id }
    });
    if (existingReport) return { error: "Já denunciou esta publicação." };

    await prisma.communityPostReport.create({
      data: { postId, reporterId: session.user.id },
    });
    // Lógica para notificar o dono da comunidade seria adicionada aqui
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível denunciar a publicação." };
  }
}

export async function manageMemberRole(communityId: string, targetUserId: string, newRole: CommunityRole) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const currentUserMember = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId } },
  });

  if (currentUserMember?.role !== "OWNER") {
    return { error: "Apenas o dono da comunidade pode alterar cargos." };
  }

  if (session.user.id === targetUserId) {
    return { error: "Não pode alterar o seu próprio cargo." };
  }

  try {
    await prisma.communityMember.update({
      where: { userId_communityId: { userId: targetUserId, communityId } },
      data: { role: newRole },
    });
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível alterar o cargo do membro." };
  }
}

export async function deleteCommunityPost(postId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado" };

    const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: { community: true }
    });

    if (!post) return { error: "Publicação não encontrada." };
    if (post.community.ownerId !== session.user.id) {
        return { error: "Não tem permissão para apagar esta publicação." };
    }

    await prisma.communityPost.delete({ where: { id: postId } });
    revalidatePath(`/communities/${post.communityId}`);
    return { success: true };
}

export async function banUserFromCommunity(communityId: string, userIdToBan: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado" };

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community || community.ownerId !== session.user.id) {
        return { error: "Não tem permissão para banir utilizadores." };
    }
    
    if (community.ownerId === userIdToBan) {
        return { error: "Não pode banir o dono da comunidade." };
    }

    try {
        await prisma.$transaction([
            prisma.bannedFromCommunity.create({
                data: { communityId, userId: userIdToBan },
            }),
            prisma.communityMember.deleteMany({
                where: { communityId, userId: userIdToBan },
            }),
        ]);
        revalidatePath(`/communities/${communityId}`);
        return { success: true };
    } catch (error) {
        return { error: "Não foi possível banir o utilizador." };
    }
}

const addCommunityCommentSchema = z.object({
  content: z.string().min(1, "O comentário não pode estar vazio."),
  postId: z.string(),
  parentId: z.string().optional(), // ID do comentário pai (se for uma resposta)
});

export async function addCommunityComment(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado" };

  const validatedFields = addCommunityCommentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { error: "Comentário inválido." };

  const { content, postId, parentId } = validatedFields.data;

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { communityId: true }
  });
  if (!post) return { error: "Publicação não encontrada." };

  try {
    await prisma.communityComment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
    });

    revalidatePath(`/communities/${post.communityId}`);
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível adicionar o comentário." };
  }
}

export async function getLatestCommunities(limit: number = 5) {
  try {
    const communities = await prisma.community.findMany({
      where: { visibility: 'public' }, // Mostra apenas as públicas na homepage
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { members: true },
        },
      },
    });
    return communities;
  } catch (error) {
    console.error("Falha ao buscar as últimas comunidades:", error);
    return [];
  }
}