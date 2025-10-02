"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Coins, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LibraryDropdown } from "./LibraryDropdown";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session?.user;

  // @ts-ignore
  const userCredits = user?.credits ?? 0;

  return (
    // ATUALIZAÇÃO: Adicionado 'hidden md:flex' para esconder o header em ecrãs pequenos (mobile)
    <header className="hidden md:flex sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Readeek
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-10 w-40 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <>
              <LibraryDropdown />

              <Link href="/shop">
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-muted/80">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span>{userCredits}</span>
                </div>
              </Link>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Avatar"} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
             <div className="flex items-center gap-2">
                 <Button variant="ghost" asChild>
                    <Link href="/login">Entrar</Link>
                 </Button>
                 <Button asChild>
                    <Link href="/register">Registar</Link>
                 </Button>
             </div>
          )}
        </div>
      </nav>
    </header>
  );
}

