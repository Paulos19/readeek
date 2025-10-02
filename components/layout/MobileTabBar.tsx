"use client";

import { Home, Library, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, User } from "@prisma/client";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MobileTabBarProps {
  user: User;
  currentlyReadingBook: Book | null;
}

export function MobileTabBar({ user, currentlyReadingBook }: MobileTabBarProps) {
  const pathname = usePathname();

  // Esconde a TabBar na página de leitura para uma experiência imersiva
  if (pathname.startsWith('/read/')) {
    return null;
  }

  const navItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/dashboard", icon: Library, label: "Biblioteca" },
    { href: "SPACER", icon: "SPACER", label: "SPACER" }, // Espaço para o botão central
    { href: "/dashboard/settings", icon: Settings, label: "Ajustes" },
    { href: `/profile/${user.id}`, icon: UserIcon, label: "Perfil" },
  ];

  const readingLocation = currentlyReadingBook?.currentLocation
    ? `#${currentlyReadingBook.currentLocation}`
    : "";

  return (
    // Container principal
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[98%] max-w-sm h-24 z-50 pointer-events-none">
      
      {/* Botão flutuante do livro */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={currentlyReadingBook ? `/read/${currentlyReadingBook.id}${readingLocation}` : "/dashboard"}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 -top-7 w-20 h-28 rounded-md overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 shadow-lg pointer-events-auto",
                "group bg-card border-2 border-primary/50 flex items-center justify-center text-center",
                !currentlyReadingBook && "w-16 h-16 rounded-full -top-4"
              )}
            >
              {currentlyReadingBook?.coverUrl ? (
                <Image
                  src={currentlyReadingBook.coverUrl}
                  alt={`Capa de ${currentlyReadingBook.title}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <Library className="h-8 w-8 text-primary" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="mb-2">
            <p>{currentlyReadingBook ? `Continuar a ler: ${currentlyReadingBook.title}` : "Escolha um livro"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Fundo da Tab Bar com SVG */}
      <div className="absolute bottom-0 left-0 w-full h-16 pointer-events-auto">
        <svg
          viewBox="0 0 320 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          // ATUALIZAÇÃO: Usa o novo efeito de brilho com a cor primária
          className="w-full h-full filter drop-shadow-primary-glow"
        >
          {/* O 'path' desenha a forma com o recorte para baixo */}
          <path
            d="M20 64C8.95 64 0 55.05 0 44V20C0 8.95 8.95 0 20 0H120C125.52 0 130 4.48 130 10V22C130 30.84 137.16 38 146 38H174C182.84 38 190 30.84 190 22V10C190 4.48 194.48 0 200 0H300C311.05 0 320 8.95 320 20V44C320 55.05 311.05 64 300 64H20Z"
            className="fill-card"
            // A borda (stroke) continua a usar a cor primária
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Ícones de Navegação - Padding aumentado para px-6 */}
      <div className="absolute bottom-0 left-0 w-full h-16 flex items-center justify-between px-6 pointer-events-auto">
        {navItems.map((item, index) => {
          if (item.href === "SPACER") {
            return <div key={index} className="w-16 h-full flex-shrink-0" />; 
          }

          const isActive = pathname === item.href;
          const Icon = item.icon as React.ElementType;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}