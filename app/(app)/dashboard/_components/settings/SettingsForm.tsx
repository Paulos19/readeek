"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Prisma, ProfileVisibility } from "@prisma/client";
import { updateUserProfile } from "@/app/actions/profileActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AvatarSelection } from "./AvatarSelection";
import { InsigniaManager } from "./InsigniaManager";
import { Loader2 } from "lucide-react";

type UserWithInsignias = Prisma.UserGetPayload<{
  include: {
    insignias: { include: { insignia: true } }
  }
}>

interface SettingsFormProps {
  user: UserWithInsignias;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user.name ?? "");
  const [about, setAbout] = useState(user.about ?? "");
  const [visibility, setVisibility] = useState(user.profileVisibility);
  const [avatar, setAvatar] = useState(user.image ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateUserProfile({ name, about, profileVisibility: visibility, image: avatar });
      if (result.error) {
        toast.error("Erro", { description: result.error });
      } else {
        toast.success("Sucesso", { description: result.success });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfil Público</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome de Utilizador</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">Sobre Mim</Label>
            <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
            <AvatarSelection currentAvatar={avatar} onSelect={setAvatar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Gerir Insígnias</CardTitle>
            <CardDescription>Escolha até 3 insígnias para exibir no seu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
            <InsigniaManager ownedInsignias={user.insignias} initiallyDisplayedIds={user.displayedInsigniaIds} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as ProfileVisibility)}>
            <div className="flex items-center space-x-2"><RadioGroupItem value="PUBLIC" id="public" /><Label htmlFor="public">Público</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="PRIVATE" id="private" /><Label htmlFor="private">Privado</Label></div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Alterações do Perfil
        </Button>
      </div>
    </form>
  );
}