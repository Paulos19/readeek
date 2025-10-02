import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

const inter = Inter({ subsets: ["latin"] });

// Configuração para a nova fonte do logo
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap',
});

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
      {/* Adicionadas as classes da nova fonte e o padding inferior para a tab bar */}
      <body className={`${inter.className} ${playfair.variable} pb-32 md:pb-0`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors />
            {/* A nova barra de navegação para mobile é renderizada aqui */}
            <MobileNavigation />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}