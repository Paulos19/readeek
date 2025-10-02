import { Book, BookCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Prisma } from "@prisma/client";

type Book = Prisma.BookGetPayload<{}>;

interface ProfileStatsProps {
  books: Book[];
}

export function ProfileStats({ books }: ProfileStatsProps) {
  const booksOnShelf = books.length;
  const booksCompleted = books.filter(book => book.progress === 100).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Livros na Estante</CardTitle>
          <Book className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{booksOnShelf}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Livros Concluídos</CardTitle>
          <BookCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{booksCompleted}</div>
        </CardContent>
      </Card>
    </div>
  );
}