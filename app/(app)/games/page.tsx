import { getGames } from "@/app/actions/gameActions";
import { Gamepad2, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30">
          <Gamepad2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Sala de Games</h1>
          <p className="text-zinc-400 font-medium">Jogue e divirta-se com jogos da comunidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="relative h-48 w-full bg-zinc-800">
              {game.coverUrl ? (
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <Gamepad2 className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                {game.plays} jogadas
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{game.title}</h3>
              <p className="text-zinc-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                {game.description || "Sem descrição disponível."}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden">
                    {game.owner.image && (
                      <Image src={game.owner.image} alt={game.owner.name || ""} width={24} height={24} className="object-cover" />
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 font-medium truncate max-w-[100px]">{game.owner.name}</span>
                </div>

                {game.isPurchased || game.price === 0 ? (
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold">
                    <Link href={`/games/${game.id}/play`}>
                      <Play className="w-4 h-4 mr-1" /> Jogar
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-full font-bold border-zinc-700 text-zinc-300 hover:text-white">
                    Comprar ({game.price} CR)
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {games.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Gamepad2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Nenhum jogo disponível</h3>
            <p className="text-zinc-500">Seja o primeiro a criar um jogo para a comunidade!</p>
          </div>
        )}
      </div>
    </div>
  );
}
