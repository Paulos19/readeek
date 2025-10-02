import Header from "@/components/layout/Header";

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // CORREÇÃO: Removido o fundo sólido para que a textura do body seja visível.
    <div className="relative min-h-screen w-full">
        {/* Este gradiente animado ficará sobre a textura de fundo. */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 animate-pulse-slow -z-10"></div>
        
        <Header />

        <main className="relative z-10">
            {children}
        </main>
    </div>
  );
}