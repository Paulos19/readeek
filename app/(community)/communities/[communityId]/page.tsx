import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CommunityTabsClient from "./_components/CommunityTabsClient"; // Importe apenas o novo componente

export default async function CommunityPage({ params }: { params: { communityId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // A busca de dados no servidor permanece igual
  const community = await prisma.community.findUnique({
    where: { id: params.communityId },
    include: {
      files: { orderBy: { createdAt: "desc" }, include: { uploader: { select: { name: true } } } },
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, image: true, communityMemberships: { where: { communityId: params.communityId } } } },
          _count: { select: { reactions: true, comments: true } },
          reactions: { where: { userId: userId ?? undefined } },
          comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true, image: true } } } }
        }
      },
      members: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: 'asc' } }
    },
  });

  if (!community) notFound();

  // A lógica de permissões permanece igual
  const currentUserMembership = community.members.find(m => m.userId === userId);
  const isOwner = currentUserMembership?.role === "OWNER";
  const isHonorary = currentUserMembership?.role === "HONORARY_MEMBER";
  const canManage = isOwner || isHonorary;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold">{community.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{community.description}</p>
      </div>
      
      {/* Renderize o componente cliente, passando todos os dados necessários */}
      <CommunityTabsClient 
        community={community as any} 
        userId={userId} 
        canManage={canManage} 
        isOwner={isOwner} 
      />
    </div>
  );
}