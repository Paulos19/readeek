"use client";

import Link from "next/link";
import { PenTool, ChevronRight } from "lucide-react";
import Image from "next/image";

export function WriterCallCard() {
  return (
    <Link href="/writer" className="block w-full mb-8 group">
      <div className="relative h-28 md:h-36 rounded-3xl overflow-hidden border border-indigo-500/20 shadow-lg shadow-indigo-900/20 transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src="https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=2073&auto=format&fit=crop"
          alt="Writer Studio Background"
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-900/80 to-indigo-900/40" />
        
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
          <div className="flex-1">
            <div className="bg-indigo-500/20 w-max px-2 py-0.5 rounded-md mb-2 border border-indigo-500/30">
              <span className="text-indigo-300 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                Writer Studio
              </span>
            </div>
            <h3 className="text-white font-black text-xl md:text-3xl shadow-sm leading-tight">
              Escreva sua<br/>Próxima História
            </h3>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 transition-transform duration-500 group-hover:rotate-12 group-hover:bg-indigo-600/50">
              <PenTool className="w-6 h-6 md:w-8 md:h-8 text-indigo-200" />
            </div>
            <div className="flex items-center text-indigo-200 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
              Acessar <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
