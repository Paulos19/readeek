import { getShopInsignias } from "@/app/actions/shopActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins } from "lucide-react";

export default async function ShopPage() {
  const insignias = await getShopInsignias();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Loja de Créditos</h1>
      
      {insignias.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">A loja está vazia</h2>
          <p className="text-muted-foreground mt-2">
            Novos itens premium aparecerão aqui em breve!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {insignias.map((insignia) => (
            <Card key={insignia.id} className="flex flex-col">
              <CardHeader className="items-center">
                <div className="relative h-24 w-24">
                  <Image src={insignia.imageUrl} alt={insignia.name} fill className="object-contain" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow text-center">
                <CardTitle>{insignia.name}</CardTitle>
                <CardDescription>{insignia.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-lg text-amber-500">
                  <Coins className="h-5 w-5" />
                  <span>{insignia.price}</span>
                </div>
                <Button className="w-full">Comprar</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}