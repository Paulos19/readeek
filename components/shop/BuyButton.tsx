"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // 1. Importe o useSession
import { purchaseInsignia } from "@/app/actions/shopActions";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";

interface BuyButtonProps {
  insigniaId: string;
  price: number;
}

export function BuyButton({ insigniaId, price }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { data: session, update } = useSession(); // 2. Obtenha a função de 'update'
  
  // @ts-ignore
  const userCredits = session?.user?.credits ?? 0;
  const hasEnoughCredits = userCredits >= price;

  const handlePurchase = () => {
    if (!hasEnoughCredits) {
      toast.error("Créditos insuficientes.");
      return;
    }

    startTransition(async () => {
      const result = await purchaseInsignia(insigniaId);
      if (result.error) {
        toast.error("Erro na compra", { description: result.error });
      } else {
        toast.success("Compra efetuada!", { description: result.success });
        
        // 3. Chame a função 'update' com os novos créditos
        // Isto irá atualizar a sessão no cliente instantaneamente
        if (result.newCredits !== undefined) {
          await update({ ...session, user: { ...session?.user, credits: result.newCredits } });
        }
      }
    });
  };

  return (
    <Button 
      className={`rounded-full px-5 py-2 font-bold transition-all ${hasEnoughCredits ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`} 
      onClick={handlePurchase} 
      disabled={isPending || !hasEnoughCredits}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      Comprar
    </Button>
  );
}