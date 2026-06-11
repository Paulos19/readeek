import { getMyDrafts } from "@/app/actions/writerActions";
import { PenTool, Plus, Book, Users, ScrollText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function WriterHomePage() {
  const drafts = await getMyDrafts();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
            <PenTool className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Writer Studio</h1>
            <p className="text-zinc-400 font-medium">Crie, edite e publique suas histórias</p>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold px-6">
          <Plus className="w-5 h-5 mr-2" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {drafts.map((draft) => (
          <Link key={draft.id} href={`/writer/${draft.id}`}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-indigo-500/50 transition-colors h-full flex flex-col">
              <div className="relative h-40 w-full bg-zinc-800 shrink-0">
                {draft.coverUrl ? (
                  <Image
                    src={draft.coverUrl}
                    alt={draft.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-60"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-950/20">
                    <PenTool className="w-12 h-12 text-indigo-900/40" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/30">
                  {draft.status === "IN_PROGRESS" ? "Em Progresso" : draft.status === "COMPLETED" ? "Concluído" : "Publicado"}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{draft.title}</h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Atualizado em {format(new Date(draft.updatedAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </p>

                <div className="flex items-center gap-4 mt-auto border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-1.5 text-zinc-400" title="Capítulos">
                    <ScrollText className="w-4 h-4" />
                    <span className="text-sm font-medium">{draft._count.chapters}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400" title="Personagens">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{draft._count.characters}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400" title="Lore">
                    <Book className="w-4 h-4" />
                    <span className="text-sm font-medium">{draft._count.lore}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {drafts.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <PenTool className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-zinc-500">Comece a escrever sua primeira obra-prima hoje mesmo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
