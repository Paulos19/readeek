"use client"; // Adicionamos 'use client' porque este componente tem interatividade (carousel, links, etc.)

import Link from "next/link";
import { Community } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Se estiver a usar um carrossel ou outra biblioteca de cliente, importe-a aqui.
// Exemplo: import { Carousel, ... } from "@/components/ui/carousel";

// A função JÁ NÃO É ASYNC e recebe as comunidades via props
export default function LatestCommunitiesList({ communities }: { communities: Community[] }) {
  
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
        <CardTitle>Comunidades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {/* O seu JSX para mostrar as comunidades vai aqui. */}
        {/* Este é um exemplo de uma lista simples. Adapte-o se usar um carrossel. */}
        <div className="space-y-3">
          {communities.map((community) => (
            <div key={community.id} className="flex items-center justify-between">
              <span className="font-medium">{community.name}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/communities/${community.id}`}>
                  Visitar
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}