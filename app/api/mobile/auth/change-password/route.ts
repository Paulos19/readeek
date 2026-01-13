import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Novos imports
import { sendMail } from "@/lib/mail";
import { getSecurityAlertTemplate } from "@/lib/emails/transactional-templates";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // --- EMAIL DE SEGURANÇA ---
    try {
        await sendMail({
            to: user.email,
            subject: "Sua senha foi alterada - Readeek",
            html: getSecurityAlertTemplate(user.name || "Usuário")
        });
    } catch (e) { console.error("Erro email senha:", e); }
    // -------------------------

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
  }
}