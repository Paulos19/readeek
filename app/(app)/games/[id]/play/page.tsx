import { getGameById } from "@/app/actions/gameActions";
import { notFound } from "next/navigation";
import { ArrowLeft, Maximize2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PlayGamePage({ params }: { params: { id: string } }) {
  // Await the params before accessing them, standard in Next.js 15 dynamic routing
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    notFound();
  }

  // Prepara o conteúdo HTML com estilos básicos para caber na tela
  const injectedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
          canvas { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        ${game.htmlContent}
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header bar overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <Button asChild variant="ghost" size="icon" className="rounded-full bg-black/40 hover:bg-black/60 text-white pointer-events-auto backdrop-blur-md border border-white/10">
          <Link href="/games">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 pointer-events-auto">
          <span className="text-white font-bold text-sm tracking-wide">{game.title}</span>
        </div>
        
        <Button variant="ghost" size="icon" className="rounded-full bg-black/40 hover:bg-black/60 text-white pointer-events-auto backdrop-blur-md border border-white/10 invisible md:visible">
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Game iframe */}
      <iframe
        srcDoc={injectedHtml}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title={game.title}
      />
    </div>
  );
}
