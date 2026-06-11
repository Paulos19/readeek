import { getDashboardBooks } from "@/app/actions/dashboardActions";
import { getFullRanking } from "@/app/actions/communityActions";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { GameArcadeCard } from "@/components/dashboard/GameArcadeCard";
import { WriterCallCard } from "@/components/dashboard/WriterCallCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ModernBookCard } from "@/components/dashboard/ModernBookCard";
import { RankingCard } from "@/components/dashboard/RankingCard";
import { BookOpen, TrendingUp, Trophy, Users, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default async function DashboardHomePage() {
  const { myBooks, featuredBooks, communityBooks, rankingBooks } = await getDashboardBooks();
  const topUsers = await getFullRanking({ page: 1, limit: 5 });

  return (
    <div className="flex-1 w-full pb-20">
      
      {/* Hero Banner */}
      <div className="mt-4 md:mt-0">
        <HeroBanner books={featuredBooks.length > 0 ? featuredBooks.slice(0, 5) : communityBooks.slice(0, 3)} />
      </div>

      {/* Game Arcade */}
      <GameArcadeCard />

      {/* Writer Studio */}
      <WriterCallCard />

      {/* Minha Biblioteca */}
      {myBooks.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Minha Biblioteca"
            subtitle="Continue de onde parou"
            icon={BookOpen}
            color="#818cf8"
            href="/dashboard/library"
          />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 p-4 pt-0">
              {myBooks.map((book) => (
                <ModernBookCard key={book.id} book={book} showProgress />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}

      {/* Hall da Fama */}
      {topUsers.users.length > 0 && (
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent pointer-events-none" />
          <SectionHeader
            title="Hall da Fama"
            subtitle="Leitores mais ativos"
            icon={Trophy}
            color="#fbbf24"
            href="/ranking"
          />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 p-4 pt-0">
              {topUsers.users.map((user, index) => (
                <RankingCard key={user.id} user={user as any} position={index + 1} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}

      {/* Em Alta */}
      {rankingBooks.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Em Alta"
            subtitle="Tendências da semana"
            icon={TrendingUp}
            color="#f472b6"
          />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-8 p-4 pt-0 pl-8">
              {rankingBooks.map((book, index) => (
                <div key={book.id} className="relative">
                  <span className="absolute -left-6 -bottom-4 text-[90px] font-black text-white/5 z-0 leading-none italic pointer-events-none select-none">
                    {index + 1}
                  </span>
                  <div className="relative z-10">
                    <ModernBookCard book={book} showProgress={false} />
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}

      {/* Comunidade */}
      <div className="mb-8">
        <SectionHeader
          title="Comunidade"
          subtitle="Obras de autores independentes"
          icon={Users}
          color="#34d399"
          href="/communities"
        />
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-4 pt-0">
            {communityBooks.length > 0 ? (
              communityBooks.map((book) => (
                <ModernBookCard key={book.id} book={book} showProgress={false} />
              ))
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-[300px] flex items-center gap-4 whitespace-normal">
                <Sparkles size={24} className="text-zinc-500 shrink-0" />
                <p className="text-zinc-500 text-sm flex-1">
                  Você explorou tudo! Novas obras da comunidade aparecerão aqui em breve.
                </p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

    </div>
  );
}