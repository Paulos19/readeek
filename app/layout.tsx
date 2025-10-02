import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Readeek",
  description: "Sua plataforma de leitura social",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Adicionado padding na parte inferior para mobile para a tab bar não sobrepor o conteúdo */}
      <body className={`${inter.className} pb-32 md:pb-0`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors />
            {/* Nova barra de navegação para mobile */}
            <MobileNavigation />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

