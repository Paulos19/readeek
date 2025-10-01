import Header from "@/components/layout/Header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}