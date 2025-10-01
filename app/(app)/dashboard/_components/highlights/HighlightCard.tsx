"use client";

import { Prisma } from "@prisma/client";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteHighlight } from "@/app/actions/highlightActions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Loader2, Trash2 } from "lucide-react";

type HighlightWithBook = Prisma.HighlightGetPayload<{
  include: { book: true };
}>;

interface HighlightCardProps {
  highlight: HighlightWithBook;
}

export function HighlightCard({ highlight }: HighlightCardProps) {
  const [isPending, startTransition] = useTransition();

  const highlightStyle = {
    borderLeftColor: highlight.color.replace("0.4", "1"),
    borderLeftWidth: "4px",
  };

  const handleDelete = () => {
    if (confirm("Tem a certeza que deseja excluir este trecho?")) {
      startTransition(async () => {
        const result = await deleteHighlight(highlight.id);
        if (result.error) {
          toast.error("Erro ao excluir", { description: result.error });
        } else {
          toast.success("Trecho excluído com sucesso!");
        }
      });
    }
  };

  return (
    <Card className="flex flex-col min-h-[220px]" style={highlightStyle}>
      <CardHeader className="flex-grow">
        <CardTitle className="text-base font-normal italic text-muted-foreground line-clamp-4">
          {/* Adicionamos line-clamp-4 para truncar o texto após 4 linhas */}
          "{highlight.text}"
        </CardTitle>
      </CardHeader>
      
      {/* CardContent opcional se houver mais conteúdo além do texto do destaque */}
      {/* <CardContent>
        Conteúdo adicional se necessário
      </CardContent> */}

      <CardFooter className="flex justify-between items-end gap-2 mt-auto pt-4"> {/* mt-auto e pt-4 garantem que o footer fique no fundo */}
        <div className="flex flex-col text-sm">
          <p className="font-semibold">{highlight.book.title}</p>
          <p className="text-muted-foreground">
            {highlight.book.author || "Autor Desconhecido"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0"> {/* flex-shrink-0 para os botões não encolherem */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/read/${highlight.book.id}#${highlight.cfiRange}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Ir para
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Excluir trecho"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}