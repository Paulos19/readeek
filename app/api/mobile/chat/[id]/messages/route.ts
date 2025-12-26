import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const messages = await prisma.message.findMany({
      where: { 
        conversationId: params.id,
        // Não mostra mensagens que este usuário deletou "para mim"
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const imageFile = formData.get("image") as File;
    const audioFile = formData.get("audio") as File;

    if (!content && !imageFile && !audioFile) {
        return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    let imageUrl = null;
    let audioUrl = null;
    let type = "TEXT";

    // Upload de Imagem
    if (imageFile) {
      type = "IMAGE";
      const blob = await put(`chat/${params.id}/images/${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
      });
      imageUrl = blob.url;
    }

    // Upload de Áudio
    if (audioFile) {
      type = "AUDIO";
      const blob = await put(`chat/${params.id}/audio/${Date.now()}.m4a`, audioFile, {
        access: 'public',
      });
      audioUrl = blob.url;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: userId,
        content: content || null,
        imageUrl,
        audioUrl,
        type,
      },
      include: { sender: { select: { id: true, name: true, image: true } } }
    });

    // Atualiza a conversa para subir na lista
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erro envio msg:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}