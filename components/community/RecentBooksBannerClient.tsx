"use client";

import dynamic from 'next/dynamic';
import type { Book, User } from "@prisma/client"; // Importa os tipos base

// A importação dinâmica com ssr: false vive dentro deste Client Component.
// Foi corrigida para carregar o 'named export' do módulo.
const RecentBooksBanner = dynamic(
  () => import('./RecentBooksBanner').then((mod) => mod.RecentBooksBanner),
  {
    ssr: false,
    loading: () => <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted"></div>,
  }
);

// 1. Define um tipo explícito para o objeto de livro que vem do servidor.
//    Este tipo corresponde exatamente aos campos que selecionou na sua `bookAction`.
type BookWithSimpleUser = Book & {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

// 2. A interface de propriedades é atualizada para usar o novo tipo.
interface RecentBooksBannerClientProps {
  books: BookWithSimpleUser[];
  currentUser: User | undefined;
}

// Este é o componente "invólucro" que você irá usar na sua página.
// Ele recebe as propriedades do Server Component e passa-as para o componente
// que é carregado dinamicamente no cliente.
export default function RecentBooksBannerClient({ books, currentUser }: RecentBooksBannerClientProps) {
  return <RecentBooksBanner books={books} currentUser={currentUser} />;
}