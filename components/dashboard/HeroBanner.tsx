"use client";

import { Book, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useState, useEffect } from "react";

interface BookWithUser extends Book {
  user: { id: string; name: string | null; image: string | null; role: string };
}

interface HeroBannerProps {
  books: BookWithUser[];
}

export function HeroBanner({ books }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (books.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % books.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [books.length]);

  if (!books.length) return null;

  const book = books[currentIndex];

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl mb-8 group">
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-zinc-900" />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3">
        <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full w-max text-xs font-bold tracking-widest uppercase mb-3">
          {book.user.role === 'ADMIN' ? 'Destaque Oficial' : 'Em Alta'}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-md">
          {book.title}
        </h2>
        <p className="text-zinc-300 text-sm md:text-base line-clamp-2 mb-6 max-w-xl font-medium">
          {book.description || "Descubra esta nova história incrível na nossa comunidade Readeek."}
        </p>

        <div className="flex items-center gap-4">
          <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link href={`/read/${book.id}`}>
              <BookOpen className="w-5 h-5 mr-2" />
              Ler Agora
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
