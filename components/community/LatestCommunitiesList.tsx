"use client";

import Link from "next/link";
// Remova a importação do 'Community' completo, pois não é mais necessário
// import { Community } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ChevronsRight } from "lucide-react";

// 1. Defina um tipo específico que corresponda aos dados que você está a buscar
type LatestCommunity = {
  id: string;
  name: string;
  _count: {
    members: number;
  };
};

// 2. Use o novo tipo na definição das propriedades
export default function LatestCommunitiesList({ communities }: { communities: LatestCommunity[] }) {
  
  if (!communities || communities.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Comunidades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma comunidade recente encontrada.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comunidades Ativas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {communities.map((community) => (
          <div key={community.id} className="flex items-center justify-between">
            <div>
              <Link href={`/communities/${community.id}`} className="font-semibold hover:underline">
                {community.name}
              </Link>
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="mr-1 h-3 w-3" />
                {community._count.members} {community._count.members === 1 ? 'membro' : 'membros'}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/communities/${community.id}`}>
                Visitar
              </Link>
            </Button>
          </div>
        ))}
        <div className="pt-4">
            <Button variant="secondary" className="w-full" asChild>
                <Link href="/communities">
                    Ver todas as comunidades
                    <ChevronsRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}