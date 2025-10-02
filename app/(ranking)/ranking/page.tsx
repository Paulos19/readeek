import { getFullRanking } from "@/app/actions/communityActions";
import { RankingClient } from "@/components/community/RankingClient";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RankingPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const page = Number(searchParams.page) || 1;
  const rankingData = await getFullRanking({ page, limit: 15 });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">Ranking Geral</h1>
          <p className="text-slate-300 mt-2 max-w-2xl mx-auto">A classificação de todos os leitores da comunidade Readeek, baseada na sua participação e paixão pela leitura.</p>
      </div>
      
      {/* Card com efeito de vidro para se integrar ao novo layout */}
      <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader>
              <CardTitle>Classificação de Leitores</CardTitle>
              <CardDescription>
                  A pontuação é calculada com base nas suas atividades: 5 pontos por post, 2 por comentário e 1 por reação.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Suspense fallback={
                  <div className="flex justify-center items-center h-64">
                      <p className="text-muted-foreground">A carregar ranking...</p>
                  </div>
              }>
                  <RankingClient initialData={rankingData} />
              </Suspense>
          </CardContent>
      </Card>
    </div>
  );
}