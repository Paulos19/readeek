// app/(community)/communities/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CommunityCard from "./[communityId]/_components/CommunityCard";

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Explorar Comunidades</h1>
        {userId && (
          <Button asChild>
            <Link href="/communities/create">Criar Comunidade</Link>
          </Button>
        )}
      </div>

      {communities.length === 0 ? (
        <p className="text-center text-muted-foreground mt-10">
          Nenhuma comunidade encontrada. Que tal criar a primeira?
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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