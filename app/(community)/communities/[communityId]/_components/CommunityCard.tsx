// app/(community)/communities/_components/CommunityCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinCommunity } from "@/app/actions/communityActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Users } from "lucide-react";
import { Prisma } from "@prisma/client";

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
      return <Button onClick={() => router.push(`/communities/${community.id}`)}>Aceder</Button>;
    }
    if (community.visibility === 'public') {
      return (
        <form action={handleJoin}>
          <input type="hidden" name="communityId" value={community.id} />
          <Button type="submit">Entrar</Button>
        </form>
      );
    }
    // Privada e não é membro
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Entrar com Senha</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comunidade Privada</DialogTitle>
            <DialogDescription>
              Esta comunidade é protegida por senha. Por favor, insira a senha para aceder.
            </DialogDescription>
          </DialogHeader>
          <form action={handleJoin} className="space-y-4">
            <input type="hidden" name="communityId" value={community.id} />
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="pr-2">{community.name}</CardTitle>
          <Badge variant={community.visibility === 'private' ? 'destructive' : 'secondary'}>
            {community.visibility === 'private' ? <Lock className="w-3 h-3 mr-1" /> : null}
            {community.visibility === 'private' ? 'Privada' : 'Pública'}
          </Badge>
        </div>
        <CardDescription>{community.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground gap-1.5">
          <Users className="w-4 h-4" />
          <span>{community._count.members} {community._count.members === 1 ? 'membro' : 'membros'}</span>
        </div>
        <ActionButton />
      </CardFooter>
    </Card>
  );
}