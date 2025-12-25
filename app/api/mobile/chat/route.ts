import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Lista as conversas do usuário logado
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          select: { id: true, name: true, image: true }
        },
        product: {
          select: { title: true, images: { take: 1 } }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar chats" }, { status: 500 });
  }
}

// POST: Cria ou recupera uma conversa existente (Start Chat)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;

    const { targetUserId, productId } = await request.json();

    if (!targetUserId) return NextResponse.json({ error: "Destinatário inválido" }, { status: 400 });

    // Verifica se já existe conversa entre esses dois para esse produto (Opcional: ou geral)
    // Aqui faremos uma busca simples: se já existe conversa entre A e B sobre produto X
    const existing = await prisma.conversation.findFirst({
      where: {
        productId: productId || undefined,
        AND: [
          { participants: { some: { id: myId } } },
          { participants: { some: { id: targetUserId } } }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Criar nova
    const newChat = await prisma.conversation.create({
      data: {
        productId: productId || undefined,
        participants: {
          connect: [{ id: myId }, { id: targetUserId }]
        }
      }
    });

    return NextResponse.json(newChat);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar chat" }, { status: 500 });
  }
}