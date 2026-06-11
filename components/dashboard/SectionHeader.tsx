import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  color?: string;
  href?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, color = "#10b981", href }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-5 mt-8 px-4 md:px-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon size={18} color={color} />}
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
            {subtitle || "Seção"}
          </span>
        </div>
        <h2 className="text-white font-black text-2xl md:text-3xl tracking-tight leading-7">
          {title}
        </h2>
      </div>
      
      {href && (
        <Link 
          href={href} 
          className="bg-zinc-800/50 hover:bg-zinc-800 transition-colors px-3 py-1.5 rounded-full flex items-center border border-zinc-700 group"
        >
          <span className="text-zinc-300 group-hover:text-white text-xs font-bold mr-1">
            Ver todos
          </span>
          <ChevronRight size={12} className="text-zinc-400 group-hover:text-white" />
        </Link>
      )}
    </div>
  );
}
