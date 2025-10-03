import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { prisma } from "@/lib/prisma";
import { PostType, User } from "@prisma/client";
import { RecentBooksBanner } from "@/components/community/RecentBooksBanner";
import { PostFilters } from "@/components/posts/PostFilters";
import { LeaderboardBanner } from "@/components/community/LeaderboardBanner";
import { getRecentSharableBooks } from "./actions/bookActions";
import { SuggestedUsersCard } from "@/components/community/SuggestedUsersCard";

interface HomePageProps {
  searchParams: {
    type?: string;
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as User | undefined;
  
  const postTypeFilter = searchParams.type;

  const posts = await prisma.post.findMany({
    where: {
      type: postTypeFilter && postTypeFilter !== 'ALL' 
        ? (postTypeFilter as PostType) 
        : undefined,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      book: true,
      reactions: true,
      comments: {
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
  
  const recentBooks = await getRecentSharableBooks();

  return (
    <div>
      <Header />
      
      <section className="w-full bg-card border-b py-8 md:py-12">
        <div className="container mx-auto">
          <LeaderboardBanner />
        </div>
      </section>

      <main className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <RecentBooksBanner books={recentBooks} currentUser={currentUser} />
            {currentUser && <CreatePostForm user={currentUser} books={userBooks} />}
            <PostFilters />

            {posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-medium">Nenhuma publicação encontrada.</h2>
                <p className="text-muted-foreground mt-2">
                  Tente um filtro diferente ou seja o primeiro a publicar!
                </p>
              </div>
            )}
          </div>

          <aside className="hidden lg:block sticky top-20">
            <SuggestedUsersCard />
          </aside>

        </div>
      </main>
    </div>
  );
}