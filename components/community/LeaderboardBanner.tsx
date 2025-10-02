import { getWeeklyTopReaders } from "@/app/actions/communityActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function LeaderboardBanner() {
  const topReaders = await getWeeklyTopReaders();

  if (topReaders.length < 3) {
    // Não renderiza o banner se não houver pelo menos 3 leitores no pódio
    return null; 
  }

  const [first, second, third] = topReaders;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-around items-end h-40">
          {/* 2º Lugar */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href={`/profile/${second.id}`}>
              <Avatar className="h-16 w-16 border-4 border-slate-300">
                <AvatarImage src={second.image ?? undefined} />
                <AvatarFallback>{second.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="font-semibold text-sm">{second.name}</div>
            <div className="text-xs font-bold text-slate-400">#2</div>
          </div>

          {/* 1º Lugar */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href={`/profile/${first.id}`}>
              <div className="relative">
                <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-8 w-8 text-amber-400" />
                <Avatar className="h-24 w-24 border-4 border-amber-400">
                  <AvatarImage src={first.image ?? undefined} />
                  <AvatarFallback className="text-3xl">{first.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </Link>
            <div className="font-semibold">{first.name}</div>
            <div className="text-sm font-bold text-amber-500">#1</div>
          </div>

          {/* 3º Lugar */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href={`/profile/${third.id}`}>
              <Avatar className="h-16 w-16 border-4 border-amber-800">
                <AvatarImage src={third.image ?? undefined} />
                <AvatarFallback>{third.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="font-semibold text-sm">{third.name}</div>
            <div className="text-xs font-bold text-amber-900">#3</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}