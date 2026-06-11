import { getConversationById } from "@/app/actions/chatActions";
import { notFound } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ChatConversationPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const conversation = await getConversationById(id);
  const session = await getServerSession(authOptions);
  const myUserId = session?.user?.id;

  if (!conversation || !myUserId) {
    notFound();
  }

  const otherUser = conversation.participants[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen w-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-background/95 backdrop-blur z-10 sticky top-0 md:top-16">
        <Link href="/chat" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
            {otherUser?.image && (
              <Image src={otherUser.image} alt={otherUser.name || "User"} fill className="object-cover" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">{otherUser?.name}</h2>
            <p className="text-xs text-zinc-500">Leitor</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => {
          const isMine = msg.senderId === myUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isMine 
                  ? 'bg-sky-600 text-white rounded-tr-sm' 
                  : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-sky-200' : 'text-zinc-500'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {conversation.messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            Nenhuma mensagem ainda. Diga olá!
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-background mb-16 md:mb-0">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="Digite uma mensagem..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-4 pr-12 text-white focus:outline-none focus:border-sky-500/50 transition-colors"
          />
          <button className="absolute right-2 p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
