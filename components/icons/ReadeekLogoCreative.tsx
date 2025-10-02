import { cn } from "@/lib/utils";
import React from "react";

interface ReadeekLogoProps extends React.SVGProps<SVGSVGElement> {
}

export const ReadeekLogoCreative = ({ className, ...props }: ReadeekLogoProps) => {
  return (
    <svg
      viewBox="0 0 250 50"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      {...props}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap');
          `}
        </style>
      </defs>

      {/* Texto "R" */}
      <text x="0" y="38" fontFamily="Nunito, sans-serif" fontSize="40" fontWeight="800" className="fill-current">R</text>
      
      {/* As letras 'ee' como um livro */}
      <g transform="translate(30 8)">
        {/* Página esquerda */}
        <path d="M2 3h6a4 4 0 0 1 4 4v20a3 3 0 0 0-3-3H2z" className="fill-current text-primary" />
        {/* Página direita */}
        <path d="M28 3h-6a4 4 0 0 0-4 4v20a3 3 0 0 1 3-3h7z" className="fill-current text-primary" />
        {/* Linhas do livro */}
        <line x1="4" y1="12" x2="10" y2="12" stroke="white" strokeWidth="1.5" />
        <line x1="4" y1="18" x2="10" y2="18" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="12" x2="26" y2="12" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="18" x2="26" y2="18" stroke="white" strokeWidth="1.5" />
      </g>
      
      {/* Texto "ad" e "k" */}
      <text x="100" y="38" fontFamily="Nunito, sans-serif" fontSize="40" fontWeight="800" className="fill-current">ad</text>
      <text x="210" y="38" fontFamily="Nunito, sans-serif" fontSize="40" fontWeight="800" className="fill-current">k</text>

    </svg>
  );
};