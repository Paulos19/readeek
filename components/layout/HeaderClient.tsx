"use client";

import dynamic from 'next/dynamic';

// Carrega o Header dinamicamente, desativando a renderização no servidor (SSR)
const Header = dynamic(
  () => import('./Header'), // Assumindo que o seu Header tem 'export default'
  {
    ssr: false, // Esta é a instrução que resolve o erro de uma vez por todas
    
    // Um placeholder para evitar um salto de layout enquanto o Header carrega
    loading: () => <header className="sticky top-0 z-40 w-full h-16 border-b bg-background/95"></header>,
  }
);

// Este componente simplesmente renderiza a versão dinâmica
export default function HeaderClient() {
  return <Header />;
}