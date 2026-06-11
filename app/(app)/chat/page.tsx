import { getConversations } from "@/app/actions/chatActions";
import { MessageCircle, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ChatListPage() {
  const conversations = await getConversations();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sky-500/20 p-3 rounded-2xl border border-sky-500/30">
          <MessageCircle className="w-8 h-8 text-sky-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mensagens</h1>
          <p className="text-zinc-400 font-medium">Conecte-se com outros leitores</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar conversas..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-sky-500/50 transition-colors"
        />
      </div>

      <div className="space-y-2">
        {conversations.map((conv) => {
          const otherUser = conv.participants[0];
          const lastMessage = conv.messages[0];
          
          if (!otherUser) return null;

          return (
            <Link key={conv.id} href={`/chat/${conv.id}`} className="block">
              <div className="bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 transition-colors">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                  {otherUser.image ? (
                    <Image src={otherUser.image} alt={otherUser.name || "User"} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-500">
                      {otherUser.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-white font-bold text-base truncate">{otherUser.name}</h3>
                    {lastMessage && (
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm truncate">
                    {lastMessage ? lastMessage.content : "Inicie uma conversa!"}
                  </p>
                </div>
                
                {lastMessage && !lastMessage.read && (
                  <div className="w-3 h-3 bg-sky-500 rounded-full shrink-0" />
                )}
              </div>
            </Link>
          );
        })}

        {conversations.length === 0 && (
          <div className="py-20 text-center">
            <MessageCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Sua caixa de entrada está vazia</h3>
            <p className="text-zinc-500">Acesse perfis de outros leitores para enviar mensagens.</p>
          </div>
        )}
      </div>
    </div>
  );
}
