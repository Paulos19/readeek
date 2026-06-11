// app/(community)/communities/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CommunityCard from "./[communityId]/_components/CommunityCard";
import { Users, Plus } from "lucide-react";

export default async function CommunitiesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // 1. Busca todas as comunidades
  const communities = await prisma.community.findMany({
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Busca as comunidades das quais o utilizador já é membro
  const userMemberships = userId ? await prisma.communityMember.findMany({
    where: { userId },
    select: { communityId: true },
  }) : [];
  
  const memberOfCommunityIds = new Set(userMemberships.map(m => m.communityId));

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/20 p-3 rounded-2xl border border-teal-500/30">
            <Users className="w-8 h-8 text-teal-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Comunidades</h1>
            <p className="text-zinc-400 font-medium">Conecte-se com leitores e autores</p>
          </div>
        </div>
        {userId && (
          <Button asChild className="bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold px-6">
            <Link href="/communities/create">
              <Plus className="w-5 h-5 mr-2" /> Criar Comunidade
            </Link>
          </Button>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
          <Users className="w-16 h-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400 mb-2">Nenhuma comunidade</h3>
          <p className="text-zinc-500 mb-6">Que tal criar a primeira comunidade do Readeek?</p>
          {userId && (
            <Button asChild className="bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold px-6">
              <Link href="/communities/create">Criar Comunidade</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isMember={memberOfCommunityIds.has(community.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}