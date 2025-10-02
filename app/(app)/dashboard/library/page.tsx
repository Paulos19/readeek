import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { BookCard } from "../_components/BookCard";
import { UploadButton } from "../_components/UploadButton";

export default async function LibraryPage() {
    const session = await getServerSession(authOptions);
    const books = await prisma.book.findMany({
        where: { userId: session!.user!.id },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Minha Biblioteca</h2>
                <UploadButton />
            </div>

            {books.length > 0 ? (
                <div className="grid gap-4 md:gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">A sua biblioteca está vazia.</p>
                    <p className="text-sm text-muted-foreground mb-4">Adicione o seu primeiro livro para começar a ler.</p>
                    <UploadButton />
                </div>
            )}
        </div>
    );
}