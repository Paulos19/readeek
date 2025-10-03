import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Importa o EpubViewer de forma dinâmica, desativando a renderização no lado do servidor (SSR)
const EpubViewer = dynamic(() => import("./_components/EpubViewer").then((mod) => mod.EpubViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">A carregar o leitor...</p>
    </div>
  ),
});

interface ReadPageProps {
  params: {
    bookId: string;
  };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const session = await getServerSession(authOptions);

  const book = await prisma.book.findUnique({
    where: { id: params.bookId },
  });

  if (!book || book.userId !== session?.user?.id) {
    return notFound();
  }

  return <EpubViewer url={book.filePath} title={book.title} bookId={book.id} />;
}