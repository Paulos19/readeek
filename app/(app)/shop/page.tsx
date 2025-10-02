import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getShopInsignias } from "@/app/actions/shopActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BuyButton } from "@/components/shop/BuyButton";
import { Coins } from "lucide-react";
import Image from "next/image";
import { User } from "@prisma/client";

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  const insignias = await getShopInsignias();
  // @ts-ignore
  const userCredits = session?.user?.credits ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Loja Readeek</h1>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-md font-semibold">
          <Coins className="h-5 w-5 text-amber-500" />
          <span>{userCredits}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Insígnias</h2>
        <p className="text-muted-foreground">Use os seus créditos para personalizar o seu perfil com insígnias exclusivas.</p>
      </div>

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
                <CardDescription className="mt-1">{insignia.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex-col gap-4 pt-4">
                <div className="flex items-center gap-2 font-bold text-lg text-amber-500">
                  <Coins className="h-5 w-5" />
                  <span>{insignia.price}</span>
                </div>
                <BuyButton insigniaId={insignia.id} price={insignia.price!} userCredits={userCredits} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}