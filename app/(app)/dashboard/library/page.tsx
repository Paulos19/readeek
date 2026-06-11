import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModernBookCard } from "@/components/dashboard/ModernBookCard";
import { UploadButton } from "../_components/UploadButton";
import { Library, BookOpen } from "lucide-react";

export default async function LibraryPage() {
    const session = await getServerSession(authOptions);
    const books = await prisma.book.findMany({
        where: { userId: session!.user!.id },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                        <Library className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Minha Biblioteca</h1>
                        <p className="text-zinc-400 font-medium">Todos os seus livros em um só lugar</p>
                    </div>
                </div>
                <UploadButton />
            </div>

            {books.length > 0 ? (
                <div className="flex flex-wrap gap-4 md:gap-6">
                    {books.map((book) => (
                        <div key={book.id} className="w-[140px] shrink-0 mb-4">
                            <ModernBookCard book={book} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
                    <BookOpen className="w-16 h-16 text-zinc-700 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-400 mb-2">A sua biblioteca está vazia</h3>
                    <p className="text-zinc-500 mb-6">Adicione o seu primeiro livro para começar a ler.</p>
                    <UploadButton />
                </div>
            )}
        </div>
    );
}