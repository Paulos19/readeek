import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Lock } from "lucide-react";
import Link from "next/link";
import { User } from "@prisma/client";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { FollowButton } from "@/components/profile/FollowButton";
import { FollowListModal } from "@/components/profile/FollowListModal";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as User | undefined;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      _count: {
        select: { posts: true, followers: true, following: true },
      },
      books: { orderBy: { updatedAt: 'desc' } },
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
          book: true,
          _count: { select: { comments: true, reactions: true } },
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const displayedInsignias = await prisma.insignia.findMany({
    where: {
      id: { in: user.displayedInsigniaIds },
    },
  });

  const isOwnProfile = user.id === currentUser?.id;
  const isProfilePrivate = user.profileVisibility === 'PRIVATE';

  const isFollowing = currentUser ? !!(await prisma.follows.findUnique({
    where: { followerId_followingId: { followerId: currentUser.id, followingId: user.id } },
  })) : false;

  if (isProfilePrivate && !isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 h-[60vh]">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Este Perfil é Privado</h1>
        <p className="text-muted-foreground">O utilizador optou por não partilhar a sua atividade publicamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Secção Header do Perfil (estilo Instagram) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
        
        {/* Coluna da Esquerda: Avatar e Insígnias */}
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary">
            <AvatarImage src={user.image ?? undefined} className="object-cover" />
            <AvatarFallback className="text-6xl">
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Secção de Insígnias */}
          {displayedInsignias.length > 0 && (
            <div className="flex justify-center gap-3">
              <TooltipProvider>
                {displayedInsignias.map(insignia => (
                  <Tooltip key={insignia.id}>
                    <TooltipTrigger>
                      <div className="relative h-12 w-12 transition-transform hover:scale-110">
                        <Image src={insignia.imageUrl} alt={insignia.name} fill />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{insignia.name}</p>
                      <p className="text-sm text-muted-foreground">{insignia.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Informações e Botões */}
        <div className="md:col-span-2 flex flex-col gap-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
            <h1 className="text-2xl font-light">{user.email.split('@')[0]}</h1>
            {isOwnProfile ? (
              <Button asChild variant="outline">
                <Link href="/dashboard/settings"><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Link>
              </Button>
            ) : (
              <FollowButton profileUserId={user.id} isFollowing={isFollowing} />
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-6 text-sm">
            <div><span className="font-semibold">{user._count.posts}</span> publicações</div>
            <FollowListModal title="Seguidores" userId={user.id} type="followers">
              <button className="hover:underline"><span className="font-semibold">{user._count.followers}</span> seguidores</button>
            </FollowListModal>
            <FollowListModal title="A Seguir" userId={user.id} type="following">
              <button className="hover:underline"><span className="font-semibold">{user._count.following}</span> a seguir</button>
            </FollowListModal>
          </div>

          <div>
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {user.about || 'Bem-vindo ao meu perfil Readeek!'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Abas com a Atividade (Mosaico) */}
      <div>
        <ProfileTabs books={user.books} posts={user.posts} />
      </div>
    </div>
  );
}