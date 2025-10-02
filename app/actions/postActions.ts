// app/actions/postActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PostType } from "@prisma/client";

const PostSchema = z.object({
  content: z.string().min(1, "O post não pode estar vazio.").max(500, "O post não pode ter mais de 500 caracteres."),
  bookId: z.string().min(1, "Tem de selecionar um livro."),
  type: z.nativeEnum(PostType),
  progressAtPost: z.coerce.number().optional(),
});

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado. Faça login para continuar." };

  const validatedFields = PostSchema.safeParse({
    content: formData.get("content"),
    bookId: formData.get("bookId"),
    type: formData.get("type"),
    progressAtPost: formData.get("progressAtPost"),
  });

  if (!validatedFields.success) return { error: validatedFields.error.flatten().fieldErrors };
  
  try {
    await prisma.post.create({
      data: {
        content: validatedFields.data.content,
        bookId: validatedFields.data.bookId,
        type: validatedFields.data.type,
        progressAtPost: validatedFields.data.progressAtPost,
        userId: session.user.id,
      },
    });
    revalidatePath("/");
    return { success: "Publicado com sucesso!" };
  } catch (error) {
    console.error("Falha ao criar post:", error);
    return { error: "Ocorreu um erro no servidor ao tentar criar o post." };
  }
}

export async function toggleReaction(postId: string, emoji: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autorizado." };
  const existingReaction = await prisma.reaction.findUnique({
    where: { userId_postId_emoji: { userId: session.user.id, postId, emoji } },
  });
  try {
    if (existingReaction) {
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
    } else {
      await prisma.reaction.create({ data: { postId, emoji, userId: session.user.id } });
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Falha na reação:", error);
    return { error: "Não foi possível processar a sua reação." };
  }
}

const CommentSchema = z.object({
    text: z.string().min(1, "O comentário não pode estar vazio.").max(280),
    postId: z.string(),
    parentId: z.string().optional(),
});

export async function createComment(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Não autorizado." };
    }

    const validatedFields = CommentSchema.safeParse({
        text: formData.get("text"),
        postId: formData.get("postId"),
        parentId: formData.get("parentId") || undefined,
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.comment.create({
            data: {
                text: validatedFields.data.text,
                postId: validatedFields.data.postId,
                userId: session.user.id,
                parentId: validatedFields.data.parentId,
            },
        });
        revalidatePath("/");
        return { success: "Comentário adicionado!" };
    } catch (error) {
        console.error("Falha ao comentar:", error);
        return { error: "Não foi possível adicionar o seu comentário." };
    }
}
