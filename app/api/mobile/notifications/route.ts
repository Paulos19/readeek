import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Busca notificações do usuário
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limite para não carregar demais
    });

    // Conta não lidas
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
}

// PATCH: Marca todas (ou uma específica) como lidas
export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { notificationId } = await request.json();

    if (notificationId) {
        // Marca uma específica
        await prisma.notification.update({
            where: { id: notificationId, userId }, // Garante que é do user
            data: { read: true }
        });
    } else {
        // Marca todas como lidas
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar notificações" }, { status: 500 });
  }
}