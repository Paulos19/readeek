import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import ReaderLoader from "./_components/ReaderLoader"; // Importa o nosso novo componente de cliente

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

  // A página do servidor agora renderiza o ReaderLoader,
  // passando os dados do livro como props.
  return (
    <ReaderLoader
      url={book.filePath}
      title={book.title}
      bookId={book.id}
    />
  );
}