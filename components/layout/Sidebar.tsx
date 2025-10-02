"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bookmark, 
  Settings, 
  Store, 
  LayoutGrid, // Ícone para o novo Dashboard
  Library     // Ícone para a Biblioteca
} from "lucide-react";
import { cn } from "@/lib/utils";

// ATUALIZAÇÃO: A lista de links agora reflete a nova estrutura do Dashboard.
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/library", label: "Biblioteca", icon: Library },
  { href: "/dashboard/highlights", label: "Trechos", icon: Bookmark },
  { href: "/shop", label: "Loja", icon: Store },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r bg-background md:fixed md:inset-y-0 md:left-0 md:z-10 md:block md:w-64">
      <div className="flex h-full max-h-screen flex-col gap-4">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Readeek
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4 pt-0">
          {navLinks.map((link) => {
            // ATUALIZAÇÃO: Lógica para destacar o link ativo.
            // O link do Dashboard (/) será ativo apenas na sua página exata.
            // Outros links (ex: /library) serão ativos se o URL começar com o href deles.
            const isActive = link.href === "/dashboard"
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
