// app/actions/followActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function toggleFollow(userIdToToggle: string) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return { error: "Não autorizado." };
  }

  if (currentUserId === userIdToToggle) {
    return { error: "Não pode seguir a si mesmo." };
  }

  try {
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userIdToToggle,
        },
      },
    });

    if (existingFollow) {
      // Se já segue, deixa de seguir
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userIdToToggle,
          },
        },
      });
      revalidatePath(`/profile/${userIdToToggle}`);
      return { success: "Deixou de seguir o utilizador." };
    } else {
      // Se não segue, começa a seguir
      await prisma.follows.create({
        data: {
          followerId: currentUserId,
          followingId: userIdToToggle,
        },
      });
      revalidatePath(`/profile/${userIdToToggle}`);
      return { success: "Começou a seguir o utilizador." };
    }
  } catch (error) {
    return { error: "Ocorreu um erro." };
  }
}

export async function getFollowers(userId: string) {
  try {
    const follows = await prisma.follows.findMany({
      where: { followingId: userId },
      include: {
        follower: true, // Inclui os dados do utilizador que segue
      },
    });
    return follows.map(f => f.follower);
  } catch (error) {
    return [];
  }
}

export async function getFollowing(userId: string) {
  try {
    const follows = await prisma.follows.findMany({
      where: { followerId: userId },
      include: {
        following: true, // Inclui os dados do utilizador que está a ser seguido
      },
    });
    return follows.map(f => f.following);
  } catch (error) {
    return [];
  }
}