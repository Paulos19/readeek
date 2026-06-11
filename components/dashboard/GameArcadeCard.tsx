"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import Image from "next/image";

export function GameArcadeCard() {
  return (
    <Link href="/games" className="block w-full mb-8 group">
      <div className="relative h-28 md:h-36 rounded-3xl overflow-hidden border border-emerald-500/20 shadow-lg shadow-emerald-900/20 transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
          alt="Arcade Background"
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-emerald-900/40" />
        
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
          <div>
            <div className="bg-emerald-500/20 w-max px-2 py-0.5 rounded-md mb-2 border border-emerald-500/30">
              <span className="text-emerald-300 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                Arcade
              </span>
            </div>
            <h3 className="text-white font-black text-2xl md:text-3xl italic shadow-sm">
              Sala de Games
            </h3>
            <p className="text-emerald-100 text-xs md:text-sm font-medium mt-1">
              Jogue, crie e ganhe créditos.
            </p>
          </div>

          <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-xl shadow-black/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-600 fill-emerald-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}
