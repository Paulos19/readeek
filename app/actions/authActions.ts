// app/actions/authActions.ts
"use server";

import { prisma } from "@/lib/prisma"; // Use a nova lib
import { UserRole } from "@prisma/client"; // Importe o Enum
import bcrypt from "bcrypt";

export async function registerUser(data: FormData) {
  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const password = data.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Todos os campos são obrigatórios." };
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return { error: "Este e-mail já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Lógica para definir a role
    const userRole = email === process.env.EMAIL_ADMIN ? UserRole.ADMIN : UserRole.USER;

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole, // Salve a role no banco de dados
      },
    });

    return { success: "Usuário registrado com sucesso! Você já pode fazer login." };
  } catch (e) {
    return { error: "Ocorreu um erro no servidor." };
  }
}