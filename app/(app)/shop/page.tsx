import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShopInsignias } from "@/app/actions/shopActions";
import { BuyButton } from "@/components/shop/BuyButton";
import { Coins, Store } from "lucide-react";
import Image from "next/image";

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  const insignias = await getShopInsignias();
  // @ts-ignore
  const userCredits = session?.user?.credits ?? 0;

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Loja Readeek</h1>
            <p className="text-zinc-400 font-medium">Use seus créditos para personalizar seu perfil</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zinc-900 border border-amber-500/30 px-5 py-2.5 text-md font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Coins className="h-6 w-6 text-amber-500" />
          <span className="text-white text-lg">{userCredits}</span>
        </div>
      </div>
      
      {insignias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
          <Store className="w-16 h-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400 mb-2">A loja está vazia</h3>
          <p className="text-zinc-500">Novos itens premium aparecerão aqui em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {insignias.map((insignia) => (
            <div key={insignia.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-amber-500/50 transition-colors flex flex-col items-center p-6 text-center">
              <div className="relative h-28 w-28 mb-4 transition-transform duration-500 group-hover:scale-110 drop-shadow-xl">
                <Image src={insignia.imageUrl} alt={insignia.name} fill className="object-contain" />
              </div>
              <h3 className="text-white font-bold text-xl mb-1">{insignia.name}</h3>
              <p className="text-zinc-400 text-sm mb-6 flex-1">{insignia.description}</p>
              
              <div className="w-full flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-1.5 font-black text-lg text-amber-500">
                  <Coins className="h-5 w-5" />
                  <span>{insignia.price}</span>
                </div>
                <BuyButton insigniaId={insignia.id} price={insignia.price!} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}