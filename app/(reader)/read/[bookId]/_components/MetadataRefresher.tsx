"use client";

import { useEffect } from "react";
import { refreshBookMetadata } from "@/app/actions/bookActions";
import { toast } from "sonner"; // Ou use o seu hook de toast existente

interface MetadataRefresherProps {
  bookId: string;
  hasCover: boolean;
  author: string | null;
}

export default function MetadataRefresher({ bookId, hasCover, author }: MetadataRefresherProps) {
  useEffect(() => {
    // Critério para disparar a atualização:
    // Se NÃO tem capa OU o autor é "Autor desconhecido" (ou nulo)
    const needsRefresh = !hasCover || !author || author === "Autor desconhecido";

    if (needsRefresh) {
      const runUpdate = async () => {
        // Notifica o usuário discretamente
        toast.info("Otimizando seu livro...", { duration: 2000 });
        
        const result = await refreshBookMetadata(bookId);
        
        if (result?.success) {
          toast.success("Capa e informações atualizadas!");
          // Opcional: Recarregar a página para mostrar a nova capa imediatamente
          // window.location.reload(); 
        }
      };

      runUpdate();
    }
  }, [bookId, hasCover, author]);

  // Este componente não renderiza nada visualmente
  return null;
}