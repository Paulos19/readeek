import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "../_components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca o utilizador completo com as suas insígnias
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      insignias: {
        include: {
          insignia: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize o seu perfil e as suas preferências.
        </p>
      </div>
      
      {/* Passamos os dados do utilizador para um componente cliente */}
      <SettingsForm user={user} />
    </div>
  );
}