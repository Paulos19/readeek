import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();
    
    // Revalidar tudo por segurança
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetCode !== code || new Date() > user.resetCodeExpires!) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetCode: null, // Limpa o código para não ser usado de novo
        resetCodeExpires: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}