// app/(app)/dashboard/_components/BookCard.tsx
import Link from 'next/link';
import { Book } from '@prisma/client';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
}

const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          className="text-gray-300 dark:text-gray-700"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
        <circle
          className="text-primary"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
          style={{ transition: 'stroke-dashoffset 0.35s' }}
        />
      </svg>
      <span className="absolute text-xl font-bold text-primary-foreground">
        {progress}%
      </span>
    </div>
  );
};

export function BookCard({ book }: BookCardProps) {
  const readingLocation = book.currentLocation ? `#${book.currentLocation}` : '';

  return (
    <Link href={`/read/${book.id}${readingLocation}`} className="group">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted shadow-lg transition-all duration-200 group-hover:shadow-xl group-hover:scale-105">
            {book.coverUrl ? (
                <Image
                    src={book.coverUrl}
                    alt={`Capa do livro ${book.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <p className="text-center font-semibold text-muted-foreground">{book.title}</p>
                </div>
            )}
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CircularProgress progress={book.progress} />
            </div>
        </div>
        <div className="mt-2">
            <h3 className="font-semibold truncate text-sm">{book.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{book.author || "Autor Desconhecido"}</p>
        </div>
    </Link>
  );
}