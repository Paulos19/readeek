"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ProfileVisibility } from "@prisma/client";
import { updateUserProfile } from "@/app/actions/profileActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AvatarSelection } from "../_components/settings/AvatarSelection";
import { Loader2 } from "lucide-react";

// É necessário buscar os dados do utilizador num componente cliente para interatividade
export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();

  // Estados locais para os campos do formulário
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>(ProfileVisibility.PUBLIC);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      // @ts-ignore // O 'about' virá de um fetch ou da sessão estendida
      setAbout(session.user.about ?? "");
      // @ts-ignore
      setVisibility(session.user.profileVisibility ?? ProfileVisibility.PUBLIC);
      setAvatar(session.user.image ?? "");
    }
  }, [session]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateUserProfile({
        name,
        about,
        profileVisibility: visibility,
        image: avatar,
      });

      if (result.error) {
        toast.error("Erro", { description: result.error });
      } else {
        toast.success("Sucesso", { description: result.success });
        // Atualiza a sessão do NextAuth com os novos dados sem forçar o logout
        await update({ name, image: avatar });
      }
    });
  };

  if (!session) {
    return <div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize o seu perfil e as suas preferências.
        </p>
      </div>

      {/* Card de Informações do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil Público</CardTitle>
          <CardDescription>
            Estas informações serão visíveis para outros utilizadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome de Utilizador</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">Sobre Mim</Label>
            <Textarea
              id="about"
              placeholder="Fale um pouco sobre si, os seus livros favoritos, etc."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card de Seleção de Avatar */}
      <Card>
        <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Escolha um avatar para o seu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
            <AvatarSelection currentAvatar={avatar} onSelect={setAvatar} />
        </CardContent>
      </Card>

      {/* Card de Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
          <CardDescription>
            Controle a visibilidade do seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={visibility} onValueChange={(value: string) => setVisibility(value as ProfileVisibility)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={ProfileVisibility.PUBLIC} id="public" />
              <Label htmlFor="public">Público - Todos podem ver o seu perfil e atividade.</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={ProfileVisibility.PRIVATE} id="private" />
              <Label htmlFor="private">Privado - Apenas você pode ver a sua atividade.</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Alterações
        </Button>
      </div>
    </form>
  );
}