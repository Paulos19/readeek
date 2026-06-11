"use client";

import Image from "next/image";
import Link from "next/link";
import { User } from "@prisma/client";

interface RankingCardProps {
  user: User & { _count?: { books: number, comments: number } };
  position: number;
}

export function RankingCard({ user, position }: RankingCardProps) {
  const isTop3 = position <= 3;
  
  return (
    <Link href={`/profile/${user.id}`} className="group block mr-4 shrink-0">
      <div className="w-[120px] h-[160px] rounded-2xl bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 p-4 flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-zinc-800">
        
        {/* Posição Badge */}
        <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg
          ${position === 1 ? 'bg-yellow-500 text-yellow-950' : 
            position === 2 ? 'bg-zinc-300 text-zinc-900' : 
            position === 3 ? 'bg-amber-700 text-amber-100' : 
            'bg-zinc-700 text-zinc-300'}`}
        >
          {position}
        </div>

        <div className={`w-16 h-16 rounded-full overflow-hidden mb-3 border-2 
          ${isTop3 ? 'border-amber-400/50' : 'border-zinc-600'}`}
        >
          {user.image ? (
            <Image 
              src={user.image} 
              alt={user.name || "User"} 
              width={64} 
              height={64} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-400">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>

        <span className="text-white font-bold text-sm text-center truncate w-full">
          {user.name || "Leitor"}
        </span>
        <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold mt-1">
          {user.credits} CRÉDITOS
        </span>
      </div>
    </Link>
  );
}
