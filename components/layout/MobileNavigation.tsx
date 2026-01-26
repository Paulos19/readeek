import { getServerSession } from "next-auth";
import { getCurrentlyReadingBook } from "@/app/actions/bookActions";
import { MobileTabBar } from "./MobileTabBar";
import { User } from "@prisma/client";
import { authOptions } from "@/lib/auth";

// Este Server Component busca os dados e só renderiza a TabBar no cliente se o utilizador estiver logado.
export async function MobileNavigation() {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as User | undefined;
  
  // Se não houver utilizador, não mostramos a tab bar
  if (!currentUser) {
    return null;
  }

  const currentlyReadingBook = await getCurrentlyReadingBook();

  // Renderiza o componente cliente, passando os dados.
  // A visibilidade é controlada aqui: visível apenas em ecrãs pequenos (abaixo de md).
  return (
    <div className="md:hidden">
      <MobileTabBar user={currentUser} currentlyReadingBook={currentlyReadingBook} />
    </div>
  );
}