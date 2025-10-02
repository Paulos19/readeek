// app/actions/shopActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Busca todas as insígnias que têm um preço (são compráveis)
export async function getShopInsignias() {
  try {
    return await prisma.insignia.findMany({
      where: { price: { not: null } },
      orderBy: { price: 'asc' },
    });
  } catch (error) {
    console.error("Erro ao buscar insígnias da loja:", error);
    return [];
  }
}

// Processa a compra de uma insígnia
export async function purchaseInsignia(insigniaId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Não autorizado. Por favor, faça login." };
  }

  const insigniaToBuy = await prisma.insignia.findUnique({
    where: { id: insigniaId },
  });

  if (!insigniaToBuy || insigniaToBuy.price === null) {
    return { error: "Item não encontrado ou não está à venda." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "Utilizador não encontrado." };
  }

  if (user.credits < insigniaToBuy.price) {
    return { error: "Créditos insuficientes." };
  }
  
  const alreadyOwns = await prisma.insigniasOnUsers.findUnique({
      where: { userId_insigniaId: { userId, insigniaId } }
  });

  if(alreadyOwns) {
      return { error: "Você já possui esta insígnia." };
  }

  try {
    // Usamos uma transação para garantir que ambas as operações funcionem ou nenhuma delas
    await prisma.$transaction(async (tx) => {
      // 1. Deduz os créditos do utilizador
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: insigniaToBuy.price! } },
      });

      // 2. Associa a insígnia ao utilizador
      await tx.insigniasOnUsers.create({
        data: {
          userId,
          insigniaId,
        },
      });
    });

    // Revalida os caminhos para que as alterações apareçam imediatamente
    revalidatePath("/shop");
    revalidatePath(`/profile/${userId}`);
    return { success: `Insignia "${insigniaToBuy.name}" comprada com sucesso!` };

  } catch (error) {
    console.error("Falha na compra da insígnia:", error);
    return { error: "Ocorreu um erro durante a compra." };
  }
}