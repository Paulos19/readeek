import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob"; // Certifique-se de ter @vercel/blob configurado
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET (Mantém igual, só garante que retorna type e imageUrl)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const messages = await prisma.message.findMany({
      where: { 
        conversationId: params.id,
        // CORREÇÃO: Não trazer mensagens que o usuário marcou como deletadas
        NOT: {
            deletedForIds: { has: userId }
        }
      },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, name: true, image: true } } }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

// POST (Atualizado para Imagens)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Processar FormData (pode vir texto OU arquivo)
    const formData = await request.formData();
    const content = formData.get("content") as string;
    const file = formData.get("image") as File;

    if (!content && !file) {
        return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    let imageUrl = null;
    let type = "TEXT";

    // Upload da imagem se existir
    if (file) {
      type = "IMAGE";
      const blob = await put(`chat/${params.id}/${Date.now()}-${file.name}`, file, {
        access: 'public',
      });
      imageUrl = blob.url;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: userId,
        content: content || null, // Pode ser nulo se for só imagem
        imageUrl,
        type,
      },
      include: { sender: { select: { id: true, name: true, image: true } } }
    });

    // Atualiza conversa
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erro no envio:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}