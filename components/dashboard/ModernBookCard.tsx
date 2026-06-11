"use client";

import { Book } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface ModernBookCardProps {
  book: Book;
  showProgress?: boolean;
}

export function ModernBookCard({ book, showProgress = true }: ModernBookCardProps) {
  return (
    <Link href={`/read/${book.id}`} className="group block mr-4 w-[140px] shrink-0">
      <div className="w-[140px] h-[210px] rounded-2xl bg-zinc-800 overflow-hidden mb-3 relative border border-zinc-700/50 shadow-xl shadow-black/50 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/20">
        {book.coverUrl ? (
          <Image 
            src={book.coverUrl} 
            alt={book.title}
            fill
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#27272a] to-[#18181b]" />
            <BookOpen className="text-zinc-500 w-10 h-10 z-10" />
            <span className="text-zinc-500 text-xs text-center px-2 mt-2 font-medium z-10 line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

        {showProgress && (book.progress || 0) > 0 && (
          <div className="absolute bottom-0 w-full h-1.5 bg-zinc-900/50">
            <div 
              className="h-full bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${book.progress}%` }} 
            />
          </div>
        )}
      </div>
      <h4 className="text-white font-bold text-sm leading-5 line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h4>
      <p className="text-zinc-500 text-xs font-medium mt-0.5 truncate">
        {book.author || "Autor Desconhecido"}
      </p>
    </Link>
  );
}
