import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
// Importe o novo componente
import MetadataRefresher from "./_components/MetadataRefresher"; 
import { EpubViewer } from "./_components/EpubViewer";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function ReadPage({ params }: PageProps) {
  // Await params correctly in Next.js 15
  const { bookId } = await params;
  
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const book = await prisma.book.findUnique({
    where: {
      id: bookId,
      userId: session.user.id,
    },
  });

  if (!book) {
    redirect("/dashboard");
  }

  // Lógica existente para location e highlights
  const initialLocation = book.currentLocation || undefined;
  const highlights = await prisma.highlight.findMany({
    where: { bookId: book.id, userId: session.user.id }
  });

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      {/* Adicione o componente aqui. Ele verificará se precisa atualizar */}
      <MetadataRefresher 
        bookId={book.id} 
        hasCover={!!book.coverUrl} 
        author={book.author} 
      />

      <EpubViewer 
        url={book.filePath} 
        initialLocation={initialLocation}
        bookId={book.id}
        initialHighlights={JSON.parse(JSON.stringify(highlights))}
      />
    </div>
  );
}