// app/actions/profileActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { ProfileVisibility } from "@prisma/client";

interface ProfileUpdateData {
  name: string;
  about: string;
  profileVisibility: ProfileVisibility;
  image: string;
}

export async function updateUserProfile(data: Partial<ProfileUpdateData>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Não autorizado." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Apenas atualiza os campos que foram fornecidos
        ...(data.name && { name: data.name }),
        ...(data.about && { about: data.about }),
        ...(data.profileVisibility && { profileVisibility: data.profileVisibility }),
        ...(data.image && { image: data.image }),
      },
    });

    // Revalida o caminho do perfil e das configurações para mostrar os dados atualizados
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/dashboard/settings");

    return { success: "Perfil atualizado com sucesso!" };
  } catch (error) {
    console.error("Falha ao atualizar o perfil:", error);
    return { error: "Não foi possível guardar as alterações." };
  }
}