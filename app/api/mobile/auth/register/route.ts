// app/api/mobile/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mantemos o mesmo segredo usado no login para consistência na assinatura de tokens
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  try {
    // 1. Parse e Sanitização básica
    const body = await request.json();
    const { name, email, password } = body;

    // Validação de entrada no Backend (Safety Net)
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Todos os campos (nome, email, senha) são obrigatórios." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Verificação de Duplicidade (Critical Path)
    // Consultamos o banco antes de tentar criar para retornar um erro amigável
    const userExists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso por outra conta." },
        { status: 409 } // 409 Conflict é o status HTTP correto para duplicidade
      );
    }

    // 3. Hashing da Senha (Segurança)
    // O custo 10 é o padrão atual da indústria para equilibrar performance/segurança
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criação do Usuário (Transaction)
    // O Prisma cuidará dos valores default definidos no schema (credits = 50, role = USER, etc.)
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        // Opcional: Se quiser garantir cores iniciais diferentes do padrão do schema
        // myBubbleColor: "#059669", 
        // otherBubbleColor: "#27272a"
      },
    });

    // 5. Auto-Login (Opcional, mas excelente UX)
    // Geramos o token imediatamente para que o app possa logar o usuário sem pedir a senha de novo, se desejar.
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Removemos a senha do objeto de retorno por segurança
    const { password: _, ...userWithoutPassword } = newUser;

    console.log(`[Auth] Novo usuário registrado: ${userWithoutPassword.email}`);

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token, // O frontend pode salvar isso no storage imediatamente se quiser pular o login
    }, { status: 201 });

  } catch (error) {
    console.error("Mobile Register Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conta. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}