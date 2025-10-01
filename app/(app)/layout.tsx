import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Sidebar para desktop */}
      <Sidebar />
      <div className="flex flex-col md:pl-64">
        {/* Header para desktop e mobile */}
        <Header />
        {/* Conteúdo principal da página */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}