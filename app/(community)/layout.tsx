import HeaderClient from "@/components/layout/HeaderClient";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderClient />
      <main className="flex-grow container mx-auto p-4">{children}</main>
    </div>
  );
}