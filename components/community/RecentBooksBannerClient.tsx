"use client";

import dynamic from 'next/dynamic';
import type { Prisma, User } from "@prisma/client";

// Tipagem para as props que o componente vai receber
type BookWithUser = Prisma.BookGetPayload<{
  include: { user: { select: { id: true, name: true } } };
}>;

interface RecentBooksBannerClientProps {
  books: BookWithUser[];
  currentUser?: User;
}

// Carrega o componente original dinamicamente, desativando a renderização no servidor (SSR)
const RecentBooksBanner = dynamic(
  () => import('./RecentBooksBanner').then((mod) => mod.RecentBooksBanner),
  {
    ssr: false, // Esta é a instrução crucial
    // Um placeholder de carregamento para uma melhor experiência do utilizador
    loading: () => <div className="h-[270px] w-full animate-pulse rounded-lg bg-card border"></div>,
  }
);

// Este é o componente que você irá usar na sua página.
// Ele apenas recebe as props e passa-as para o componente carregado dinamicamente.
export default function RecentBooksBannerClient({ books, currentUser }: RecentBooksBannerClientProps) {
  return <RecentBooksBanner books={books} currentUser={currentUser} />;
}