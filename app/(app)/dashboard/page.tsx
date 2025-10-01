import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "./_components/UploadButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Minha Biblioteca</h1>
        <UploadButton />
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">Sua biblioteca está vazia</h2>
          <p className="text-muted-foreground mt-2">
            Clique em "Adicionar Livro" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((book) => (
            <Link href={`/read/${book.id}`} key={book.id}>
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 h-full">
                <CardHeader>
                  <CardTitle className="truncate text-base">{book.title}</CardTitle>
                  <CardDescription className="truncate text-sm">
                    {book.author || "Autor desconhecido"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}