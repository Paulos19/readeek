// app/(community)/communities/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCommunity } from "@/app/actions/communityActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [visibility, setVisibility] = useState("public");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await createCommunity(formData);

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Comunidade criada.",
      });
      router.push(`/communities/${result.communityId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Criar Nova Comunidade</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da Comunidade</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select name="type" defaultValue="forum">
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forum">Fórum de Discussão</SelectItem>
              <SelectItem value="study">Grupo de Estudos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Visibilidade</Label>
          <Select
            name="visibility"
            value={visibility}
            onValueChange={setVisibility}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a visibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Pública</SelectItem>
              <SelectItem value="private">Privada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visibility === "private" && (
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        )}
        <Button type="submit">Criar Comunidade</Button>
      </form>
    </div>
  );
}