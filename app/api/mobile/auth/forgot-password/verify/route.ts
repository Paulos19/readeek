import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.resetCode !== code) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return NextResponse.json({ error: "Código expirado" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}