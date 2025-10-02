"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ReadeekLogoProps extends React.SVGProps<SVGSVGElement> {
}

export const ReadeekLogo = ({ className, ...props }: ReadeekLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <svg
        viewBox="0 0 280 50" // Ajustado o viewBox para acomodar o novo tamanho da pena
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-auto" // Tamanho base
        {...props}
      >
        <defs>
          <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>
          <linearGradient id="metallic-gradient-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
        </defs>

        {/* --- DESKTOP LOGO (Texto completo + Pena no fim) --- */}
        <g className="hidden md:inline">
          <text
            x="0"
            y="38"
            fontFamily="'Playfair Display', serif"
            fontSize="48"
            fontWeight="700"
            className="fill-[url(#metallic-gradient)] dark:fill-[url(#metallic-gradient-dark)]"
            stroke="hsl(var(--foreground) / 0.5)"
            strokeWidth="0.5"
          >
            Readeek
          </text>
          {/* ATUALIZAÇÃO: Posição, tamanho e cor da pena para desktop */}
          <image 
            href="/quill-pen.svg" 
            x="205" // Mais próximo da palavra
            y="5"   // Ajuste vertical
            height="40" // Mesmo tamanho que a altura do texto
            width="40"  // Proporcional
            className="fill-primary text-primary" // Garante a cor verde pastel
          />
        </g>
        
        {/* --- MOBILE LOGO ('R' + Pena ao lado) --- */}
        <g className="md:hidden">
          <text
            x="0"
            y="38"
            fontFamily="'Playfair Display', serif"
            fontSize="48"
            fontWeight="700"
            className="fill-[url(#metallic-gradient)] dark:fill-[url(#metallic-gradient-dark)]"
            stroke="hsl(var(--foreground) / 0.5)"
            strokeWidth="0.5"
          >
            R
          </text>
          {/* ATUALIZAÇÃO: Posição, tamanho e cor da pena para mobile */}
          <image 
            href="/quill-pen.svg" 
            x="35" // Perto do 'R'
            y="8"  // Ajuste vertical
            height="30" // Tamanho proporcional ao 'R'
            width="30"  // Proporcional
            className="fill-primary text-primary" // Garante a cor verde pastel
          />
        </g>
      </svg>
    </div>
  );
};