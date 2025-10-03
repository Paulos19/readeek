"use client"; // Marca este como um Componente de Cliente

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// O tipo de props que este componente irá receber
interface ReaderLoaderProps {
  url: string;
  title: string;
  bookId: string;
}

// Movemos a importação dinâmica para este ficheiro de cliente
const EpubViewer = dynamic(
  () => import("./EpubViewer").then((mod) => mod.EpubViewer),
  {
    ssr: false, // Isto é permitido aqui porque estamos num Componente de Cliente
    loading: () => (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">A carregar o leitor...</p>
      </div>
    ),
  }
);

// Este componente simplesmente recebe as props e passa-as para o EpubViewer
export default function ReaderLoader({ url, title, bookId }: ReaderLoaderProps) {
  return <EpubViewer url={url} title={title} bookId={bookId} />;
}