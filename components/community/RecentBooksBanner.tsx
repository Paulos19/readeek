"use client";

import { Prisma, User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { requestBook } from "@/app/actions/shareActions";

type BookWithUser = Prisma.BookGetPayload<{
  include: { user: { select: { id: true, name: true } } };
}>;

interface RecentBooksBannerProps {
  books: BookWithUser[];
  currentUser?: User;
}

export function RecentBooksBanner({ books, currentUser }: RecentBooksBannerProps) {
  const [isPending, startTransition] = useTransition();

  const handleRequest = (bookId: string, ownerId: string) => {
    startTransition(async () => {
      if (!currentUser) {
        toast.error("Precisa de estar autenticado para pedir um livro.");
        return;
      }
      const result = await requestBook(bookId, ownerId);
      if (result.error) {
        toast.error("Erro", { description: result.error });
      } else {
        toast.success("Sucesso", { description: result.success });
      }
    });
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionados Recentemente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex space-x-4 pb-4 overflow-x-auto">
            {books.map((book) => (
              <div key={book.id} className="min-w-[150px] flex-shrink-0 group">
                <Link href={`/read/${book.id}`} className="block">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted shadow-lg transition-all duration-200 group-hover:shadow-xl group-hover:scale-105">
                     <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <p className="text-sm font-semibold text-muted-foreground">{book.title}</p>
                    </div>
                  </div>
                </Link>
                <div className="mt-2">
                  <h3 className="font-semibold truncate text-sm">{book.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{book.user.name}</span>
                     {currentUser?.id !== book.userId && (
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => handleRequest(book.id, book.userId)} 
                          disabled={isPending}
                          aria-label="Pedir partilha"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                       </Button>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}