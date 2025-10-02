// app/actions/shopActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Ação para buscar os itens da loja (insígnias premium)
export async function getShopInsignias() {
  return prisma.insignia.findMany({
    where: { type: 'PREMIUM' },
    orderBy: { price: 'asc' },
  });
}

// Ação para comprar uma insígnia
export async function purchaseInsignia(insigniaId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Não autorizado." };
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
    // Transação: Garante que ambas as operações (deduzir créditos e adicionar insígnia) ocorram com sucesso
    await prisma.$transaction(async (tx) => {
      // 1. Deduzir os créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: insigniaToBuy.price! } },
      });

      // 2. Adicionar a insígnia ao utilizador
      await tx.insigniasOnUsers.create({
        data: {
          userId,
          insigniaId,
        },
      });
    });

    revalidatePath("/shop");
    revalidatePath(`/profile/${userId}`);
    return { success: `Insignia "${insigniaToBuy.name}" comprada com sucesso!` };

  } catch (error) {
    console.error("Falha na compra:", error);
    return { error: "Ocorreu um erro durante a compra." };
  }
}