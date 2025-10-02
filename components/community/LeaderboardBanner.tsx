import { getWeeklyTopReaders, TopReader } from "@/app/actions/communityActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Trophy, Sparkles, ChevronsRight } from "lucide-react";
import Link from "next/link";

export async function LeaderboardBanner() {
  const topReaders = await getWeeklyTopReaders();

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400" size={24} />;
    if (index === 1) return <Trophy className="text-gray-400" size={24} />;
    if (index === 2) return <Sparkles className="text-orange-400" size={24} />;
    return <span className="text-lg font-bold w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Leitores da Semana</h2>
        <p className="text-muted-foreground mt-1">Veja quem mais se destacou na comunidade nos últimos 7 dias.</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        {topReaders.length > 0 ? (
          topReaders.slice(0, 3).map((reader, index) => (
            <Link href={`/profile/${reader.id}`} key={reader.id} className="block group">
              <div className="flex flex-col items-center p-4 border rounded-lg bg-background hover:bg-accent transition-colors">
                {getRankIcon(index)}
                <Avatar className="w-20 h-20 mt-4 mb-2 border-2 border-transparent group-hover:border-primary">
                  <AvatarImage src={reader.image ?? undefined} />
                  <AvatarFallback>{reader.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-lg group-hover:underline">{reader.name}</p>
                <p className="text-sm text-secondary font-semibold">{reader.score} Pontos</p>
              </div>
            </Link>
          ))
        ) : (
          <p className="md:col-span-3 text-center text-muted-foreground py-8">
            Ainda não há dados suficientes para formar o ranking desta semana. Participe!
          </p>
        )}
      </div>

      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/ranking">
            Ver Ranking Completo
            <ChevronsRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}