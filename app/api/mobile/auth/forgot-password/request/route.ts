import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { getPasswordResetTemplate } from "@/lib/emails/transactional-templates";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Retornamos sucesso mesmo se não existir para evitar enumeração de usuários (Segurança)
      return NextResponse.json({ success: true });
    }

    // Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode: code, resetCodeExpires: expires }
    });

    await sendMail({
      to: email,
      subject: "Seu código de recuperação - Readeek",
      html: getPasswordResetTemplate(user.name || "Leitor", code)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}