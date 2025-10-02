import { cn } from "@/lib/utils";
import React from "react";

interface ReadeekLogoProps extends React.SVGProps<SVGSVGElement> {
}

export const ReadeekLogoElegant = ({ className, ...props }: ReadeekLogoProps) => {
  return (
    <svg
      viewBox="0 0 230 40"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      {...props}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
          `}
        </style>
      </defs>

      {/* Ícone de Pena estilizado como 'R' */}
      <g transform="translate(5 0) scale(1.5)">
        <path
          d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
          className="fill-current text-primary"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <line x1="18" y1="9" x2="11" y2="16" stroke="currentColor" strokeWidth="0.7" />
        <path d="m2.05 17.95.01-.01" stroke="currentColor" strokeWidth="0.7" />
      </g>
      
      {/* Texto "eadeek" */}
      <text
        x="40"
        y="32"
        fontFamily="'Playfair Display', serif"
        fontSize="36"
        fontWeight="700"
        className="fill-current"
      >
        eadeek
      </text>
    </svg>
  );
};