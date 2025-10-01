// components/forms/AuthForm.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import React from "react";

export function AuthForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Inicia o processo de login com o provedor 'credentials'
    const result = await signIn("credentials", {
      redirect: false, // Importante: evita o redirecionamento automático
      email,
      password,
    });

    if (result?.error) {
      // Se houver erro, exibe uma notificação
      toast.error("Falha no login", {
        description: "Email ou senha incorretos. Tente novamente.",
      });
    } else {
      // Se o login for bem-sucedido, redireciona para o dashboard
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
      router.refresh(); // Garante que a página seja recarregada com os dados do usuário
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Digite seu e-mail e senha para acessar sua biblioteca.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{" "}
          <Link href="/register" className="underline">
            Registre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}