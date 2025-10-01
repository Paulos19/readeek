// components/forms/RegisterForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner"; // <--- 1. IMPORT ATUALIZADO
import { registerUser } from "@/app/actions/authActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  // const { toast } = useToast(); // <--- 2. REMOVA A LINHA DO HOOK ANTIGO

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      // 3. USE A API DO SONNER PARA ERROS
      toast.error("Erro no registro", {
        description: result.error,
        // Você pode adicionar mais opções aqui
        // action: { label: "Tentar Novamente", onClick: () => console.log("Tentar Novamente") },
      });
    } else {
      // 4. USE A API DO SONNER PARA SUCESSO
      toast.success("Sucesso!", {
        description: result.success,
      });
      router.push("/login"); 
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Registrar</CardTitle>
        <CardDescription>Crie uma conta para começar a salvar seus livros.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" type="text" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Criar conta
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Já tem uma conta?{" "}
          <Link href="/login" className="underline">
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}