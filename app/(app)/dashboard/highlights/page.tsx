import { getAllHighlightsForUser } from "@/app/actions/highlightActions";
import { HighlightCard } from "../_components/highlights/HighlightCard";

export default async function HighlightsPage() {
  const highlights = await getAllHighlightsForUser();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Trechos Marcados</h1>
      
      {highlights.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">Nenhum trecho marcado ainda</h2>
          <p className="text-muted-foreground mt-2">
            Use a função de marcação nos seus livros para guardar os seus trechos favoritos aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {highlights.map((highlight) => (
            <HighlightCard key={highlight.id} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
}