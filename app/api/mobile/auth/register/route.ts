// app/api/mobile/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Importações do sistema de Email
import { sendMail } from "@/lib/mail";
import { getWelcomeTemplate } from "@/lib/emails/welcome-template";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  try {
    // 1. Parse e Sanitização básica
    const body = await request.json();
    const { name, email, password } = body;

    // Validação de entrada
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Todos os campos (nome, email, senha) são obrigatórios." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Verificação de Duplicidade
    const userExists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso por outra conta." },
        { status: 409 }
      );
    }

    // 3. Hashing da Senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criação do Usuário (Transaction)
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        credits: 50, // Bônus inicial padrão
        // Outros campos assumem o default do schema
      },
    });

    // 5. Auto-Login (Gerar Token)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // --- INTEGRAÇÃO NODEMAILER (GATILHO DE BOAS-VINDAS) ---
    // Envolvemos em try/catch para que falhas no envio de email
    // NÃO impeçam o usuário de se registrar com sucesso.
    try {
        console.log(`[Email] Tentando enviar boas-vindas para: ${newUser.email}`);
        
        const htmlContent = getWelcomeTemplate(newUser.name || "Leitor");
        
        await sendMail({
            to: newUser.email,
            subject: "Bem-vindo ao universo Readeek! 🚀",
            html: htmlContent
        });
        
        console.log(`[Email] Email de boas-vindas enviado com sucesso.`);
    } catch (emailError) {
        // Logamos o erro mas não retornamos 500 para o cliente,
        // pois a conta foi criada corretamente.
        console.error("⚠️ Falha ao enviar email de boas-vindas:", emailError);
    }
    // -------------------------------------------------------

    // Removemos a senha do objeto de retorno por segurança
    const { password: _, ...userWithoutPassword } = newUser;

    console.log(`[Auth] Novo usuário registrado: ${userWithoutPassword.email}`);

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    }, { status: 201 });

  } catch (error) {
    console.error("Mobile Register Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conta. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}