// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { TopReadersCard } from "@/components/community/TopReadersCard";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as User | undefined;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      book: true,
      reactions: true,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        include: { 
          user: true,
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { user: true }
          }
        }
      },
      _count: {
        select: { comments: true, reactions: true }
      }
    },
    take: 20,
  });

  const userBooks = currentUser
    ? await prisma.book.findMany({ where: { userId: currentUser.id }, orderBy: { title: 'asc' } })
    : [];

  return (
    <div>
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Coluna Principal (Feed) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {currentUser && <CreatePostForm user={currentUser} books={userBooks} />}

            {/* <<< LEITORES DA SEMANA (APENAS PARA MOBILE) >>> */}
            <div className="lg:hidden">
                <TopReadersCard />
            </div>

            {posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-medium">Ainda não há atividade.</h2>
                <p className="text-muted-foreground mt-2">
                  Seja o primeiro a partilhar a sua leitura!
                </p>
              </div>
            )}
          </div>

          {/* Barra Lateral (APENAS PARA DESKTOP) */}
          <aside className="hidden lg:block sticky top-20">
            <TopReadersCard />
          </aside>

        </div>
      </main>
    </div>
  );
}