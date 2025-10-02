"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { purchaseInsignia } from "@/app/actions/shopActions";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";

interface BuyButtonProps {
  insigniaId: string;
  price: number;
  userCredits: number;
}

export function BuyButton({ insigniaId, price, userCredits }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
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
      }
    });
  };

  return (
    <Button 
      className="w-full" 
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