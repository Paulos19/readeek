// app/(community)/communities/_components/CommunityCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinCommunity } from "@/app/actions/communityActions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Users, Globe } from "lucide-react";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type CommunityWithMembersCount = Prisma.CommunityGetPayload<{
  include: { _count: { select: { members: true } } }
}>;

interface CommunityCardProps {
  community: CommunityWithMembersCount;
  isMember: boolean;
}

export default function CommunityCard({ community, isMember }: CommunityCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleJoin = async (formData: FormData) => {
    const result = await joinCommunity(formData);

    if (result.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Entrou na comunidade." });
      setOpen(false);
      router.push(`/communities/${community.id}`);
    }
  };

  const ActionButton = () => {
    if (isMember) {
      return <Button onClick={() => router.push(`/communities/${community.id}`)} className="w-full bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 rounded-full text-sm font-bold border border-teal-900/30 transition-colors">Acessar Comunidade</Button>;
    }
    if (community.visibility === 'public' || community.visibility === 'PUBLIC') {
      return (
        <form action={handleJoin} className="w-full">
          <input type="hidden" name="communityId" value={community.id} />
          <Button type="submit" className="w-full bg-zinc-800 text-zinc-300 hover:bg-teal-600 hover:text-white rounded-full text-sm font-bold transition-colors">Entrar</Button>
        </form>
      );
    }
    // Privada e não é membro
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-zinc-800 text-zinc-300 hover:bg-rose-600 hover:text-white rounded-full text-sm font-bold transition-colors">Entrar com Senha</Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Comunidade Privada</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Esta comunidade é protegida por senha. Por favor, insira a senha para acessar.
            </DialogDescription>
          </DialogHeader>
          <form action={handleJoin} className="space-y-4">
            <input type="hidden" name="communityId" value={community.id} />
            <div>
              <Label htmlFor="password" className="text-zinc-300">Senha</Label>
              <Input id="password" name="password" type="password" required className="bg-zinc-900 border-zinc-800 text-white mt-1" />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white">Entrar</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-teal-500/50 transition-colors h-full flex flex-col group">
      <div className="relative h-32 w-full bg-zinc-800 shrink-0">
        {community.coverUrl ? (
          <Image
            src={community.coverUrl}
            alt={community.name}
            fill
            className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-teal-950/20">
            <Users className="w-10 h-10 text-teal-900/40 mb-2" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-white text-xs font-bold">{community._count.members}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10" title={community.visibility === 'public' || community.visibility === 'PUBLIC' ? "Pública" : "Privada"}>
              {community.visibility === 'public' || community.visibility === 'PUBLIC' ? (
                <Globe className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-white mb-2 line-clamp-1">{community.name}</h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
          {community.description || "Nenhuma descrição disponível."}
        </p>

        <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
          <ActionButton />
        </div>
      </div>
    </div>
  );
}