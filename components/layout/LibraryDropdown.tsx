"use client";

import { useEffect, useState } from "react";
import { Book } from "@prisma/client";
import Link from "next/link";
import { getCurrentlyReadingBook } from "@/app/actions/bookActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Book as BookIcon, Library, Loader2 } from "lucide-react";
import Image from "next/image";

export function LibraryDropdown() {
  const [currentlyReading, setCurrentlyReading] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentlyReading = async () => {
    setIsLoading(true);
    const book = await getCurrentlyReadingBook();
    setCurrentlyReading(book);
    setIsLoading(false);
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) fetchCurrentlyReading(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Biblioteca">
          <Library className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Acesso Rápido</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : currentlyReading ? (
          <DropdownMenuItem asChild>
            <Link href={`/read/${currentlyReading.id}#${currentlyReading.currentLocation || ''}`} className="flex items-start gap-3">
              <div className="relative h-20 w-14 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                {currentlyReading.coverUrl ? (
                  <Image src={currentlyReading.coverUrl} alt={currentlyReading.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold line-clamp-2">{currentlyReading.title}</p>
                <p className="text-xs text-muted-foreground">Progresso: {currentlyReading.progress}%</p>
                <p className="text-xs text-blue-500 mt-1">Continuar a ler</p>
              </div>
            </Link>
          </DropdownMenuItem>
        ) : (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">Nenhum livro na sua estante.</p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <Library className="mr-2 h-4 w-4" />
            <span>Ver toda a biblioteca</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}